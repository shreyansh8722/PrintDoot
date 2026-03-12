from rest_framework import serializers
from decimal import Decimal
from .models import (
    Order, OrderItem, PrintJob, Shipment, ShipmentTrackingEvent,
    OrderStatusHistory,
    Invoice, ReturnRequest, Refund,
    InstamojoTransaction, PaymentLog,
    ShippingZone, ShippingRate, PincodeServiceability,
)
from apps.users.serializers import AddressSerializer

import logging
security_logger = logging.getLogger('security')

# Anti-fraud constants
MAX_QUANTITY_PER_ITEM = 100       # Maximum quantity per single item
MAX_ITEMS_PER_ORDER = 50          # Maximum unique items per order
MAX_ORDER_VALUE = Decimal('500000')  # ₹5,00,000 max order value


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'design', 'quantity', 'unit_price', 'total_price',
                  'product_name', 'product_name_snapshot', 'sku_snapshot',
                  'frozen_canvas_state', 'print_file_url', 'high_res_design_url',
                  'render_status', 'design_price', 'zakeke_design_id']
        read_only_fields = ['id', 'unit_price', 'total_price', 'product_name_snapshot',
                           'sku_snapshot', 'frozen_canvas_state', 'print_file_url',
                           'high_res_design_url', 'render_status']

    def create(self, validated_data):
        design = validated_data.get('design')
        if design:
            validated_data['frozen_canvas_state'] = design.design_json
        product = validated_data.get('product')
        if product:
            validated_data['product_name_snapshot'] = product.name
            validated_data['sku_snapshot'] = product.sku
            validated_data['unit_price'] = product.base_price
            validated_data['total_price'] = product.base_price * validated_data['quantity']
        return super().create(validated_data)


class ShipmentTrackingEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShipmentTrackingEvent
        fields = ['id', 'status', 'status_code', 'description', 'location',
                  'event_time', 'created_at']
        read_only_fields = fields


class ShipmentSerializer(serializers.ModelSerializer):
    tracking_events = ShipmentTrackingEventSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Shipment
        fields = ['carrier', 'tracking_number', 'status', 'status_display',
                  'shipped_at', 'delivered_at', 'estimated_delivery',
                  'awb_code', 'courier_name', 'label_url',
                  'shiprocket_order_id', 'shiprocket_shipment_id',
                  'tracking_events']
        read_only_fields = ['shipped_at', 'delivered_at']


class CreateShipmentSerializer(serializers.Serializer):
    """Input for creating a Shiprocket shipment from an order."""
    order_id = serializers.IntegerField()
    weight_kg = serializers.DecimalField(max_digits=6, decimal_places=3, required=False, default=0.5)
    length = serializers.IntegerField(required=False, default=20)
    breadth = serializers.IntegerField(required=False, default=15)
    height = serializers.IntegerField(required=False, default=10)

    def validate_order_id(self, value):
        try:
            order = Order.objects.get(id=value)
        except Order.DoesNotExist:
            raise serializers.ValidationError("Order not found.")
        if order.status not in ('Paid', 'Processing', 'Printing'):
            raise serializers.ValidationError(
                f"Order is in '{order.status}' status. Shipment can only be created "
                f"for Paid/Processing/Printing orders."
            )
        if hasattr(order, 'shipment'):
            raise serializers.ValidationError("A shipment already exists for this order.")
        return value


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_username = serializers.ReadOnlyField(source='changed_by.username')

    class Meta:
        model = OrderStatusHistory
        fields = ['id', 'old_status', 'new_status', 'changed_by', 'changed_by_username', 'note', 'created_at']
        read_only_fields = ['id', 'old_status', 'new_status', 'changed_by', 'created_at']


class InvoiceSerializer(serializers.ModelSerializer):
    pdf_url = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = ['id', 'invoice_number', 'pdf_url', 'issued_at',
                  'subtotal', 'tax_total', 'shipping_total', 'discount_total', 'grand_total']
        read_only_fields = fields

    def get_pdf_url(self, obj):
        if obj.pdf_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.pdf_file.url)
            return obj.pdf_file.url
        return None


class ReturnRequestSerializer(serializers.ModelSerializer):
    items = serializers.PrimaryKeyRelatedField(
        many=True, queryset=OrderItem.objects.all(), required=False
    )

    class Meta:
        model = ReturnRequest
        fields = ['id', 'order', 'reason', 'description', 'status', 'items',
                  'admin_notes', 'approved_at', 'rejected_at', 'created_at', 'updated_at']
        read_only_fields = ['id', 'status', 'admin_notes', 'approved_at', 'rejected_at',
                           'created_at', 'updated_at']

    def validate_order(self, order):
        user = self.context['request'].user
        if order.user != user:
            raise serializers.ValidationError("You can only create returns for your own orders.")
        if order.status != 'Delivered':
            raise serializers.ValidationError("Returns can only be requested for delivered orders.")
        # Check if a non-cancelled return already exists
        existing = ReturnRequest.objects.filter(order=order).exclude(status__in=['Cancelled', 'Rejected', 'Completed'])
        if existing.exists():
            raise serializers.ValidationError("An active return request already exists for this order.")
        return order

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        validated_data['user'] = self.context['request'].user
        return_request = ReturnRequest.objects.create(**validated_data)
        if items_data:
            return_request.items.set(items_data)
        return return_request


class RefundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Refund
        fields = ['id', 'order', 'return_request', 'amount', 'reason', 'status',
                  'refund_method', 'transaction_id', 'initiated_at', 'completed_at']
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    shipping_address_details = AddressSerializer(source='shipping_address', read_only=True)
    shipment = ShipmentSerializer(read_only=True)
    invoice = InvoiceSerializer(read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    return_requests = ReturnRequestSerializer(many=True, read_only=True)
    refunds = RefundSerializer(many=True, read_only=True)
    allowed_transitions = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'status', 'allowed_transitions', 'total_amount', 'currency',
            'subtotal', 'tax_total', 'shipping_total', 'discount_total',
            'shipping_address', 'shipping_address_details',
            'payment_method', 'customer_notes',
            'is_paid', 'paid_at', 'transaction_id',
            'estimated_delivery_date',
            'items', 'shipment', 'invoice', 'status_history',
            'return_requests', 'refunds',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'updated_at',
                           'total_amount', 'subtotal', 'tax_total',
                           'is_paid', 'paid_at', 'transaction_id',
                           'estimated_delivery_date']

    def get_allowed_transitions(self, obj):
        return Order.VALID_TRANSITIONS.get(obj.status, [])

    def validate_items(self, items):
        """Validate order items for anti-fraud protection."""
        if not items:
            raise serializers.ValidationError("Order must contain at least one item.")
        if len(items) > MAX_ITEMS_PER_ORDER:
            raise serializers.ValidationError(
                f"Maximum {MAX_ITEMS_PER_ORDER} unique items per order."
            )
        for item in items:
            qty = item.get('quantity', 0)
            if qty < 1:
                raise serializers.ValidationError("Quantity must be at least 1.")
            if qty > MAX_QUANTITY_PER_ITEM:
                raise serializers.ValidationError(
                    f"Maximum quantity per item is {MAX_QUANTITY_PER_ITEM}."
                )
            product = item.get('product')
            if product and not product.is_active:
                raise serializers.ValidationError(
                    f"Product '{product.name}' is no longer available."
                )
            # Check stock
            if product and not product.is_infinite_stock and product.stock_quantity < qty:
                raise serializers.ValidationError(
                    f"Insufficient stock for '{product.name}'. Available: {product.stock_quantity}."
                )
        return items

    def validate_shipping_address(self, address):
        """Ensure the shipping address belongs to the authenticated user."""
        user = self.context['request'].user
        if address and address.user != user:
            raise serializers.ValidationError(
                "You can only use your own shipping addresses."
            )
        return address

    def create(self, validated_data):
        items_data = validated_data.pop('items')

        # SERVER-SIDE PRICE CALCULATION — Never trust client prices
        subtotal = sum(item['product'].base_price * item['quantity'] for item in items_data)
        tax_rate = Decimal('0.18')  # GST 18%
        tax_total = round(subtotal * tax_rate, 2)
        shipping_total = validated_data.get('shipping_total', 0) or 0
        discount_total = validated_data.get('discount_total', 0) or 0
        total_amount = subtotal + tax_total + Decimal(str(shipping_total)) - Decimal(str(discount_total))

        # Anti-fraud: Reject unreasonably large orders
        if total_amount > MAX_ORDER_VALUE:
            raise serializers.ValidationError(
                f"Order value exceeds maximum allowed (₹{MAX_ORDER_VALUE:,.2f}). "
                f"Please contact support for bulk orders."
            )

        # Anti-fraud: Reject negative totals
        if total_amount < 0:
            raise serializers.ValidationError("Invalid order total.")

        validated_data['subtotal'] = subtotal
        validated_data['tax_total'] = tax_total
        validated_data['shipping_total'] = shipping_total
        validated_data['discount_total'] = discount_total
        validated_data['total_amount'] = total_amount
        validated_data['user'] = self.context['request'].user

        # Security log
        user = self.context['request'].user
        security_logger.info(
            f"Order created by user={user.username} (id={user.id}), "
            f"items={len(items_data)}, total=₹{total_amount}"
        )

        order = Order.objects.create(**validated_data)

        for item_data in items_data:
            product = item_data['product']
            design = item_data.get('design')
            quantity = item_data['quantity']
            design_price = item_data.get('design_price', 0) or 0
            zakeke_design_id = item_data.get('zakeke_design_id', '')
            OrderItem.objects.create(
                order=order,
                product=product,
                design=design,
                quantity=quantity,
                unit_price=product.base_price,
                total_price=product.base_price * quantity,
                product_name_snapshot=product.name,
                sku_snapshot=product.sku,
                frozen_canvas_state=design.design_json if design else None,
                design_price=design_price,
                zakeke_design_id=zakeke_design_id,
            )

        # Create initial status history
        OrderStatusHistory.objects.create(
            order=order,
            old_status='',
            new_status='Pending',
            changed_by=self.context['request'].user,
            note='Order placed'
        )

        # Send order confirmation email
        try:
            from .email_service import send_order_confirmation_email
            send_order_confirmation_email(order)
        except Exception:
            pass  # Don't fail order creation if email fails

        # Auto-push COD orders to Shipmozo immediately
        if order.payment_method and order.payment_method.lower() == 'cod':
            try:
                from apps.orders import shipmozo_service
                from .models import Shipment, ShipmentTrackingEvent
                import logging
                logger = logging.getLogger(__name__)

                push_result = shipmozo_service.push_order(order)
                if push_result.get('success'):
                    shipmozo_order_id = push_result.get('shipmozo_order_id', '')
                    logger.info(f"COD Order #{order.id} auto-pushed to Shipmozo: {shipmozo_order_id}")

                    # Try auto-assigning courier
                    awb_code = ''
                    courier_name = ''
                    try:
                        assign_result = shipmozo_service.auto_assign_courier(shipmozo_order_id)
                        if assign_result.get('success'):
                            awb_code = assign_result.get('awb_number', '')
                            courier_name = assign_result.get('courier_company', '')
                    except Exception:
                        pass

                    # Create local Shipment record
                    from django.utils import timezone as tz
                    Shipment.objects.create(
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
                else:
                    logger.warning(f"Shipmozo push failed for COD order #{order.id}: {push_result.get('message')}")
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f"Shipmozo auto-push failed for COD order #{order.id}: {e}")

        return order


class OrderStatusTransitionSerializer(serializers.Serializer):
    """Serializer for the status transition endpoint."""
    new_status = serializers.ChoiceField(choices=Order.STATUS_CHOICES)
    note = serializers.CharField(required=False, allow_blank=True, default='')


# =============================================================================
# MODULE 4: PAYMENT SERIALIZERS
# =============================================================================

class CreateInstamojoPaymentSerializer(serializers.Serializer):
    """Input for creating an Instamojo payment from an existing Order."""
    order_id = serializers.IntegerField()

    def validate_order_id(self, value):
        user = self.context['request'].user
        try:
            order = Order.objects.get(id=value, user=user)
        except Order.DoesNotExist:
            raise serializers.ValidationError("Order not found or does not belong to you.")
        if order.status != 'Pending':
            raise serializers.ValidationError(f"Order is in '{order.status}' status. Payment can only be initiated for Pending orders.")
        return value


class VerifyPaymentSerializer(serializers.Serializer):
    """Input for verifying an Instamojo payment after redirect."""
    payment_request_id = serializers.CharField(max_length=100)
    payment_id = serializers.CharField(max_length=100)


class InstamojoTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstamojoTransaction
        fields = [
            'id', 'instamojo_payment_request_id', 'instamojo_payment_id',
            'amount', 'currency', 'status', 'method',
            'purpose', 'longurl',
            'email', 'contact',
            'error_code', 'error_description',
            'amount_refunded',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields


class PaymentLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentLog
        fields = [
            'id', 'order', 'event_type', 'instamojo_payment_request_id', 'instamojo_payment_id',
            'is_success', 'error_message', 'created_at',
        ]
        read_only_fields = fields


# =============================================================================
# MODULE 5: SHIPPING SERIALIZERS
# =============================================================================

class ShippingRateSerializer(serializers.ModelSerializer):
    zone_name = serializers.ReadOnlyField(source='zone.name')
    method_label = serializers.ReadOnlyField(source='get_method_display')

    class Meta:
        model = ShippingRate
        fields = [
            'id', 'zone', 'zone_name', 'method', 'method_label',
            'min_weight_grams', 'max_weight_grams',
            'base_rate', 'per_kg_rate', 'base_weight_grams',
            'free_above', 'min_days', 'max_days', 'is_active',
        ]
        read_only_fields = fields


class CheckServiceabilitySerializer(serializers.Serializer):
    """Input for checking if a pincode is serviceable."""
    pincode = serializers.CharField(max_length=10)


class CalculateShippingSerializer(serializers.Serializer):
    """Input for calculating shipping cost."""
    pincode = serializers.CharField(max_length=10)
    items = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        help_text="List of {product: <id>, quantity: <int>}. If omitted, uses weight_grams."
    )
    weight_grams = serializers.IntegerField(
        required=False, min_value=0,
        help_text="Total weight in grams. Ignored if items provided."
    )
    order_subtotal = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False, default=0,
        help_text="Order subtotal in ₹ for free-shipping threshold check."
    )
    method = serializers.ChoiceField(
        choices=['standard', 'express', 'priority'],
        required=False, default=None,
        help_text="Specific method to calculate. If omitted, returns all available methods."
    )

    def validate(self, data):
        if not data.get('items') and not data.get('weight_grams'):
            raise serializers.ValidationError(
                "Provide either 'items' (list of product+qty) or 'weight_grams'."
            )
        return data


class ShippingOptionResultSerializer(serializers.Serializer):
    """Output schema for a single shipping option."""
    method = serializers.CharField()
    method_label = serializers.CharField()
    cost = serializers.DecimalField(max_digits=10, decimal_places=2)
    is_free = serializers.BooleanField()
    free_above = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    eta_min_days = serializers.IntegerField()
    eta_max_days = serializers.IntegerField()
    weight_grams = serializers.IntegerField()
    zone = serializers.CharField()
    cod_available = serializers.BooleanField(required=False)
