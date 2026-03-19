import json
import logging
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action, api_view, permission_classes as perm_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import FileResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.conf import settings as django_settings
from shop_project.throttles import OrderCreateThrottle, PaymentThrottle, ShippingThrottle
from .models import (
    Order, OrderItem, Invoice, ReturnRequest, Refund,
    InstamojoTransaction, PaymentLog, Shipment, ShipmentTrackingEvent,
)
from .serializers import (
    OrderSerializer, OrderItemSerializer, OrderStatusTransitionSerializer,
    InvoiceSerializer, ReturnRequestSerializer, RefundSerializer,
    CreateInstamojoPaymentSerializer, VerifyPaymentSerializer,
    InstamojoTransactionSerializer, PaymentLogSerializer,
    CheckServiceabilitySerializer, CalculateShippingSerializer,
    ShippingOptionResultSerializer,
    ShipmentSerializer, ShipmentTrackingEventSerializer, CreateShipmentSerializer,
)

logger = logging.getLogger(__name__)


class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # For ReturnRequest/Refund, check user field
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False


class IsOrderOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


class OrderViewSet(viewsets.ModelViewSet):
    """
    Full Order lifecycle.
    Create: Checkout process (snapshots prices/designs).
    List: Order history.
    Actions: transition_status, generate_invoice, download_invoice
    """
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrderOwner]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'total_amount']
    # Restrict HTTP methods — users cannot PUT/DELETE orders directly
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        return self.request.user.orders.prefetch_related(
            'items__product', 'shipment', 'invoice',
            'status_history', 'return_requests', 'refunds'
        ).all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='transition')
    def transition_status(self, request, pk=None):
        """
        POST /orders/{id}/transition/
        Body: { "new_status": "Cancelled", "note": "Changed my mind" }
        
        Regular users can only cancel their orders.
        Admin/staff can perform any valid transition.
        """
        order = self.get_object()
        serializer = OrderStatusTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['new_status']
        note = serializer.validated_data.get('note', '')

        # SECURITY: Regular users can only cancel orders, not mark as Paid/Shipped/etc.
        if not request.user.is_staff and not request.user.is_superuser:
            if new_status != 'Cancelled':
                return Response(
                    {'error': 'You can only cancel orders. Other transitions are handled automatically.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        if not order.can_transition_to(new_status):
            allowed = Order.VALID_TRANSITIONS.get(order.status, [])
            return Response(
                {
                    'error': f"Cannot transition from '{order.status}' to '{new_status}'.",
                    'allowed_transitions': allowed,
                    'current_status': order.status,
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        order.transition_status(new_status, changed_by=request.user, note=note)

        # Auto-generate invoice when order moves to Paid
        if new_status == 'Paid':
            self._create_invoice(order)
            # Send payment confirmation email
            try:
                from .email_service import send_payment_confirmation_email
                transaction = getattr(order, 'instamojo_transaction', None)
                send_payment_confirmation_email(order, transaction)
            except Exception as email_err:
                logger.warning(f"Failed to send payment confirmation email: {email_err}")

        return Response(OrderSerializer(order, context={'request': request}).data)

    def _create_invoice(self, order):
        """Create invoice and generate PDF when order is paid."""
        from .invoice_generator import generate_invoice_pdf

        if hasattr(order, 'invoice'):
            return order.invoice  # Already exists

        invoice = Invoice.objects.create(
            order=order,
            subtotal=order.subtotal,
            tax_total=order.tax_total,
            shipping_total=order.shipping_total,
            discount_total=order.discount_total,
            grand_total=order.total_amount,
        )
        generate_invoice_pdf(invoice)
        return invoice

    @action(detail=True, methods=['get'], url_path='invoice')
    def get_invoice(self, request, pk=None):
        """GET /orders/{id}/invoice/ — returns invoice metadata."""
        order = self.get_object()
        if not hasattr(order, 'invoice'):
            return Response(
                {'error': 'No invoice available. Order must be in Paid status or later.'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = InvoiceSerializer(order.invoice, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='invoice/download')
    def download_invoice(self, request, pk=None):
        """GET /orders/{id}/invoice/download/ — returns the PDF file."""
        order = self.get_object()
        if not hasattr(order, 'invoice') or not order.invoice.pdf_file:
            return Response(
                {'error': 'Invoice PDF not available.'},
                status=status.HTTP_404_NOT_FOUND
            )
        invoice = order.invoice
        return FileResponse(
            invoice.pdf_file.open('rb'),
            content_type='application/pdf',
            as_attachment=True,
            filename=f'Invoice_{invoice.invoice_number}.pdf'
        )

    @action(detail=True, methods=['get'], url_path='status-history')
    def status_history(self, request, pk=None):
        """GET /orders/{id}/status-history/ — returns full status change log."""
        order = self.get_object()
        from .serializers import OrderStatusHistorySerializer
        serializer = OrderStatusHistorySerializer(
            order.status_history.all(), many=True, context={'request': request}
        )
        return Response(serializer.data)


class ReturnRequestViewSet(viewsets.ModelViewSet):
    """
    Customer return requests.
    Create: Request a return for a delivered order.
    List: View all return requests.
    """
    serializer_class = ReturnRequestSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    http_method_names = ['get', 'post', 'head', 'options']  # No PUT/PATCH/DELETE for customers

    def get_queryset(self):
        return ReturnRequest.objects.filter(user=self.request.user).select_related('order').prefetch_related('items')

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        """POST /returns/{id}/cancel/ — cancel a pending return request."""
        return_request = self.get_object()
        if return_request.status != 'Requested':
            return Response(
                {'error': 'Only pending return requests can be cancelled.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return_request.status = 'Cancelled'
        return_request.save()
        return Response(ReturnRequestSerializer(return_request, context={'request': request}).data)


class RefundViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only view of refunds for the authenticated user.
    Refunds are created by admin when approving returns.
    """
    serializer_class = RefundSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Refund.objects.filter(user=self.request.user).select_related('order', 'return_request')


# =============================================================================
# MODULE 4: PAYMENT VIEWS — Instamojo Integration
# =============================================================================

class CreateInstamojoPaymentView(APIView):
    """
    POST /payments/create-order/
    Body: { "order_id": 123 }

    Creates an Instamojo payment request and returns the payment URL
    for the frontend to redirect the user.
    """
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [PaymentThrottle]

    def post(self, request):
        serializer = CreateInstamojoPaymentSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        order_id = serializer.validated_data['order_id']
        order = Order.objects.get(id=order_id, user=request.user)

        from .instamojo_service import create_instamojo_payment
        from django.conf import settings

        ip = self._get_client_ip(request)
        ua = request.META.get('HTTP_USER_AGENT', '')

        # Build redirect and webhook URLs
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        redirect_url = f"{frontend_url}/checkout/instamojo-callback"
        
        # Build webhook URL from the backend
        backend_base = request.build_absolute_uri('/').rstrip('/')
        webhook_url = f"{backend_base}/api/v1/orders/payments/webhook/"

        try:
            transaction, payment_request = create_instamojo_payment(
                order=order, user=request.user,
                redirect_url=redirect_url,
                webhook_url=webhook_url,
                ip_address=ip, user_agent=ua,
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to create Instamojo payment: {str(e)}'},
                status=status.HTTP_502_BAD_GATEWAY
            )

        return Response({
            'payment_request_id': payment_request['id'],
            'payment_url': payment_request['longurl'],
            'order_id': order.id,
        })

    @staticmethod
    def _get_client_ip(request):
        xff = request.META.get('HTTP_X_FORWARDED_FOR')
        return xff.split(',')[0].strip() if xff else request.META.get('REMOTE_ADDR')


class VerifyPaymentView(APIView):
    """
    POST /payments/verify/
    Body: { "payment_request_id": "...", "payment_id": "..." }

    Verifies the Instamojo payment after redirect.
    """
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [PaymentThrottle]

    def post(self, request):
        serializer = VerifyPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from .instamojo_service import verify_payment

        ip = request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip() or request.META.get('REMOTE_ADDR')
        ua = request.META.get('HTTP_USER_AGENT', '')

        transaction, success, error_msg = verify_payment(
            payment_request_id=serializer.validated_data['payment_request_id'],
            payment_id=serializer.validated_data['payment_id'],
            user=request.user,
            ip_address=ip,
            user_agent=ua,
        )

        if success:
            # Send payment confirmation email
            try:
                from .email_service import send_payment_confirmation_email
                send_payment_confirmation_email(transaction.order, transaction)
            except Exception as email_err:
                logger.warning(f"Failed to send payment email after verify: {email_err}")

            # Auto-push order to Shipmozo
            shipmozo_result = {}
            try:
                from . import shipmozo_service
                from .models import Shipment, ShipmentTrackingEvent # Import models here
                order = transaction.order
                push_result = shipmozo_service.push_order(order)
                if push_result.get('success'):
                    shipmozo_order_id = push_result.get('shipmozo_order_id', '')
                    logger.info(f"Order #{order.id} auto-pushed to Shipmozo: {shipmozo_order_id}")

                    # Try auto-assigning courier
                    awb_code = ''
                    courier_name = ''
                    try:
                        assign_result = shipmozo_service.auto_assign_courier(shipmozo_order_id)
                        if assign_result.get('success'):
                            awb_code = assign_result.get('awb_number', '')
                            courier_name = assign_result.get('courier_company', '')
                    except Exception as assign_err:
                        logger.warning(f"Shipmozo auto-assign skipped for order #{order.id}: {assign_err}")

                    # Create local Shipment record
                    from django.utils import timezone as tz
                    shipment = Shipment.objects.create(
                        order=order,
                        carrier=courier_name or 'Shipmozo',
                        tracking_number=awb_code,
                        label_url='',
                        status='label_created',
                        weight_kg=0.5,
                        shiprocket_order_id=shipmozo_order_id,
                        shiprocket_shipment_id='',
                        awb_code=awb_code,
                        courier_name=courier_name,
                    )
                    ShipmentTrackingEvent.objects.create(
                        shipment=shipment,
                        status='Order Placed',
                        status_code='label_created',
                        description=f'Order paid and pushed to Shipmozo. Courier: {courier_name or "pending assignment"}',
                        location='',
                        event_time=tz.now(),
                    )
                    shipmozo_result = {
                        'shipmozo_order_id': shipmozo_order_id,
                        'awb_number': awb_code,
                        'courier': courier_name,
                    }
                else:
                    logger.warning(f"Shipmozo push failed for order #{transaction.order_id}: {push_result.get('message')}")
            except Exception as shipmozo_err:
                logger.warning(f"Shipmozo auto-push failed for order #{transaction.order_id}: {shipmozo_err}")

            return Response({
                'success': True,
                'message': 'Payment verified successfully.',
                'order_id': transaction.order_id,
                'transaction': InstamojoTransactionSerializer(transaction).data,
                'shipmozo': shipmozo_result,
            })
        else:
            return Response(
                {'success': False, 'error': error_msg},
                status=status.HTTP_400_BAD_REQUEST
            )


@method_decorator(csrf_exempt, name='dispatch')
class InstamojoWebhookView(APIView):
    """
    POST /payments/webhook/
    Instamojo sends webhook events here.
    No authentication — verified via MAC signature.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # No auth for webhooks

    def post(self, request):
        from .instamojo_service import verify_webhook_signature, handle_webhook_event

        # Instamojo sends form-encoded data
        payload = request.POST.dict() if request.POST else {}
        if not payload:
            try:
                payload = json.loads(request.body)
            except json.JSONDecodeError:
                return Response({'error': 'Invalid payload'}, status=status.HTTP_400_BAD_REQUEST)

        if not verify_webhook_signature(payload):
            logger.warning("Instamojo webhook: Invalid MAC signature")
            return Response({'error': 'Invalid signature'}, status=status.HTTP_403_FORBIDDEN)

        result = handle_webhook_event(payload)
        return Response(result, status=status.HTTP_200_OK)


class TransactionLogsView(APIView):
    """
    GET /payments/transactions/
    Returns all Instamojo transactions for the authenticated user.

    GET /payments/transactions/{order_id}/
    Returns transaction + payment logs for a specific order.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, order_id=None):
        if order_id:
            # Specific order
            try:
                order = Order.objects.get(id=order_id, user=request.user)
            except Order.DoesNotExist:
                return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

            transaction = getattr(order, 'instamojo_transaction', None)
            logs = PaymentLog.objects.filter(order=order).order_by('-created_at')

            return Response({
                'transaction': InstamojoTransactionSerializer(transaction).data if transaction else None,
                'logs': PaymentLogSerializer(logs, many=True).data,
            })
        else:
            # All transactions
            transactions = InstamojoTransaction.objects.filter(user=request.user)
            return Response({
                'transactions': InstamojoTransactionSerializer(transactions, many=True).data,
            })


# =============================================================================
# MODULE 5: SHIPPING VIEWS
# =============================================================================

class CheckServiceabilityView(APIView):
    """
    POST /shipping/check-serviceability/
    Body: { "pincode": "400001" }

    Returns whether the pincode is serviceable, available methods, and COD flag.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ShippingThrottle]

    def post(self, request):
        serializer = CheckServiceabilitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from .shipping_calculator import check_serviceability
        result = check_serviceability(serializer.validated_data['pincode'])
        return Response(result)


class CalculateShippingView(APIView):
    """
    POST /shipping/calculate/
    Body: {
        "pincode": "400001",
        "items": [{"product": 5, "quantity": 2}, ...],
        // OR "weight_grams": 500,
        "order_subtotal": 1500.00,
        "method": "standard"   // optional; omit to get all methods
    }

    Returns shipping cost breakdown for the given parameters.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ShippingThrottle]

    def post(self, request):
        serializer = CalculateShippingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from .shipping_calculator import (
            calculate_shipping, calculate_all_shipping_options,
            calculate_order_weight
        )
        from decimal import Decimal

        pincode = serializer.validated_data['pincode']
        order_subtotal = Decimal(str(serializer.validated_data.get('order_subtotal', 0)))
        method = serializer.validated_data.get('method')

        # Determine weight
        items = serializer.validated_data.get('items')
        weight_grams = serializer.validated_data.get('weight_grams')

        if items:
            weight_grams = calculate_order_weight(items)

        if not weight_grams:
            weight_grams = 200  # Default fallback

        if method:
            # Single method
            result = calculate_shipping(
                pincode=pincode,
                weight_grams=weight_grams,
                order_subtotal=order_subtotal,
                method=method,
            )
            return Response(result)
        else:
            # All methods
            results = calculate_all_shipping_options(
                pincode=pincode,
                weight_grams=weight_grams,
                order_subtotal=order_subtotal,
            )
            return Response({'options': results})


# =============================================================================
# MODULE 6: SHIPMENT TRACKING VIEWS
# =============================================================================

class CreateShipmentView(APIView):
    """
    POST /tracking/create-shipment/
    Body: { "order_id": 123, "weight_kg": 0.5, "length": 20, "breadth": 15, "height": 10 }

    Creates a shipment via Shipmozo for the given order.
    Admin/staff only.
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        serializer = CreateShipmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order_id = serializer.validated_data['order_id']
        order = Order.objects.get(id=order_id)

        from . import shipmozo_service

        # Step 1: Push order to Shipmozo
        try:
            push_result = shipmozo_service.push_order(order)
        except Exception as e:
            return Response(
                {'error': f'Failed to push order to Shipmozo: {str(e)}'},
                status=status.HTTP_502_BAD_GATEWAY
            )

        if not push_result.get('success'):
            return Response(
                {'error': push_result.get('message', 'Failed to push order to Shipmozo')},
                status=status.HTTP_502_BAD_GATEWAY
            )

        shipmozo_order_id = push_result.get('shipmozo_order_id', '')

        # Step 2: Auto-assign courier (gets AWB + courier)
        awb_code = ''
        courier_name = ''
        try:
            assign_result = shipmozo_service.auto_assign_courier(shipmozo_order_id)
            if assign_result.get('success'):
                awb_code = assign_result.get('awb_number', '')
                courier_name = assign_result.get('courier_company', '')
        except Exception as e:
            logger.warning(f'Shipmozo auto-assign failed: {e}')

        # Create local Shipment record
        shipment = Shipment.objects.create(
            order=order,
            carrier=courier_name or 'Shipmozo',
            tracking_number=awb_code,
            label_url='',
            status='label_created',
            weight_kg=serializer.validated_data.get('weight_kg', 0.5),
            shiprocket_order_id=shipmozo_order_id,  # Reusing field for Shipmozo order ID
            shiprocket_shipment_id='',
            awb_code=awb_code,
            courier_name=courier_name,
        )

        # Create initial tracking event
        from django.utils import timezone as tz
        ShipmentTrackingEvent.objects.create(
            shipment=shipment,
            status='Label Created',
            status_code='label_created',
            description=f'Order pushed to Shipmozo. Courier: {courier_name or "pending"}',
            location='',
            event_time=tz.now(),
        )

        # Transition order to Shipped if applicable
        if order.can_transition_to('Shipped'):
            order.transition_status(
                'Shipped',
                changed_by=request.user,
                note=f'Shipped via {shipment.carrier} (AWB: {shipment.awb_code})'
            )

        return Response(ShipmentSerializer(shipment).data, status=status.HTTP_201_CREATED)


class TrackShipmentView(APIView):
    """
    GET /tracking/{order_id}/
    Returns tracking details for an order's shipment.
    Also fetches latest updates from Shipmozo API.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        if not hasattr(order, 'shipment'):
            return Response(
                {'error': 'No shipment found for this order.'},
                status=status.HTTP_404_NOT_FOUND
            )

        shipment = order.shipment

        # Optionally refresh from Shipmozo (if AWB is available)
        refresh = request.query_params.get('refresh', 'false').lower() == 'true'
        if refresh and shipment.awb_code:
            try:
                from . import shipmozo_service
                tracking_result = shipmozo_service.track_order(shipment.awb_code)

                if tracking_result.get('success'):
                    tracking_data = tracking_result.get('tracking_data', {})

                    # Update shipment status if changed
                    current_status = tracking_data.get('current_status') or tracking_data.get('status', '')
                    if current_status:
                        STATUS_MAP = {
                            'DELIVERED': 'delivered',
                            'IN TRANSIT': 'in_transit',
                            'OUT FOR DELIVERY': 'out_for_delivery',
                            'PICKED UP': 'picked_up',
                            'PICKUP SCHEDULED': 'pickup_scheduled',
                            'RTO INITIATED': 'rto_initiated',
                            'RTO DELIVERED': 'rto_delivered',
                            'CANCELED': 'cancelled',
                            'CANCELLED': 'cancelled',
                            'SHIPPED': 'in_transit',
                            'PENDING': 'label_created',
                        }
                        mapped = STATUS_MAP.get(current_status.upper(), shipment.status)
                        if mapped != shipment.status:
                            shipment.status = mapped
                            shipment.save()

                    # Add tracking events from scan history
                    scans = tracking_data.get('scans', tracking_data.get('tracking_events', []))
                    if isinstance(scans, list):
                        from django.utils import timezone as tz
                        from datetime import datetime
                        for scan in scans:
                            event_time = tz.now()
                            event_time_str = scan.get('date', scan.get('event_time', ''))
                            if event_time_str:
                                for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%dT%H:%M:%S', '%d-%m-%Y %H:%M:%S'):
                                    try:
                                        event_time = datetime.strptime(event_time_str, fmt)
                                        event_time = tz.make_aware(event_time)
                                        break
                                    except (ValueError, TypeError):
                                        continue

                            ShipmentTrackingEvent.objects.get_or_create(
                                shipment=shipment,
                                event_time=event_time,
                                status=scan.get('status', scan.get('activity', '')),
                                defaults={
                                    'status_code': scan.get('status_code', ''),
                                    'location': scan.get('location', scan.get('city', '')),
                                    'description': scan.get('description', scan.get('activity', '')),
                                    'raw_data': scan,
                                }
                            )
            except Exception as e:
                logger.warning(f"Failed to refresh tracking from Shipmozo: {e}")

        serializer = ShipmentSerializer(shipment)
        return Response(serializer.data)


@method_decorator(csrf_exempt, name='dispatch')
class ShiprocketWebhookView(APIView):
    """
    POST /tracking/webhook/
    Shiprocket sends tracking update webhooks here.
    Verified via webhook token configured in Shiprocket dashboard.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        # Verify webhook token if configured
        webhook_token = getattr(django_settings, 'SHIPROCKET_WEBHOOK_TOKEN', '')
        if webhook_token:
            # Check for token in header or query param
            received_token = (
                request.META.get('HTTP_X_WEBHOOK_TOKEN', '') or
                request.query_params.get('token', '')
            )
            if not received_token or received_token != webhook_token:
                logger.warning(
                    f"Shiprocket webhook: Invalid or missing token from "
                    f"IP: {request.META.get('REMOTE_ADDR')}"
                )
                return Response({'error': 'Invalid webhook token'}, status=status.HTTP_403_FORBIDDEN)

        try:
            payload = json.loads(request.body) if isinstance(request.body, bytes) else request.data
        except (json.JSONDecodeError, Exception):
            return Response({'error': 'Invalid JSON'}, status=status.HTTP_400_BAD_REQUEST)

        from .shiprocket_service import process_tracking_webhook

        try:
            result = process_tracking_webhook(payload)

            # Send shipping update email if status changed
            if result.get('status') == 'processed':
                try:
                    shipment = Shipment.objects.select_related('order__user').get(
                        id=result['shipment_id']
                    )
                    from .email_service import send_shipping_update_email
                    send_shipping_update_email(shipment.order, shipment)
                except Exception as email_err:
                    logger.warning(f"Failed to send shipping update email: {email_err}")

            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Shiprocket webhook processing failed: {e}")
            return Response(
                {'error': 'Webhook processing failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# =============================================================================
# CART STOCK HOLD / RELEASE
# =============================================================================

class CartStockHoldView(APIView):
    """
    POST /api/v1/orders/cart/hold-stock/
    Hold stock for a product while the user is in the checkout flow.
    Body: { "product_id": <int>, "quantity": <int> }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from apps.catalog.models import Product
        from .models import StockHold

        # Lazy cleanup of expired holds
        StockHold.cleanup_expired()

        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))

        if not product_id:
            return Response({'error': 'product_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        if quantity < 1:
            return Response({'error': 'quantity must be >= 1'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        if product.is_infinite_stock:
            return Response({
                'status': 'ok',
                'message': 'Product has infinite stock, no hold needed.',
                'available_stock': 999999,
            })

        # Release any existing holds by this user for the same product
        StockHold.objects.filter(
            product=product,
            user=request.user,
            is_released=False,
        ).update(is_released=True)

        # Check available stock
        available = StockHold.get_available_stock(product)
        if quantity > available:
            return Response({
                'error': f'Insufficient stock. Available: {available}',
                'available_stock': available,
            }, status=status.HTTP_409_CONFLICT)

        # Create hold
        hold = StockHold.objects.create(
            product=product,
            user=request.user,
            session_key=request.session.session_key or '',
            quantity=quantity,
        )

        return Response({
            'status': 'ok',
            'hold_id': hold.id,
            'product_id': product.id,
            'quantity': quantity,
            'expires_at': hold.expires_at.isoformat(),
            'available_stock': StockHold.get_available_stock(product),
        }, status=status.HTTP_201_CREATED)


class CartStockReleaseView(APIView):
    """
    POST /api/v1/orders/cart/release-stock/
    Release a stock hold (e.g., when user removes item from cart).
    Body: { "hold_id": <int> } or { "product_id": <int> }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from .models import StockHold

        hold_id = request.data.get('hold_id')
        product_id = request.data.get('product_id')

        if hold_id:
            holds = StockHold.objects.filter(
                id=hold_id, user=request.user, is_released=False
            )
        elif product_id:
            holds = StockHold.objects.filter(
                product_id=product_id, user=request.user, is_released=False
            )
        else:
            return Response(
                {'error': 'Provide hold_id or product_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        count = holds.update(is_released=True)
        return Response({
            'status': 'ok',
            'released_count': count,
        })
