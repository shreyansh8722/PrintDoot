from rest_framework import viewsets, permissions, filters, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Offer, Banner, PromoCode, OfflinePayment
from .serializers import OfferSerializer, BannerSerializer, PromoCodeSerializer, OfflinePaymentSerializer
from apps.users.permissions import IsAdminOrStaff


class AdminOfferViewSet(viewsets.ModelViewSet):
    """
    Admin-only ViewSet for managing homepage marquee offers.
    """
    queryset = Offer.objects.all()
    serializer_class = OfferSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrStaff]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['text']
    ordering_fields = ['display_order', 'created_at']
    ordering = ['display_order', '-created_at']


class AdminBannerViewSet(viewsets.ModelViewSet):
    """
    Admin-only ViewSet for managing banners / hero images.
    """
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrStaff]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'subtitle', 'position']
    ordering_fields = ['display_order', 'created_at', 'position']
    ordering = ['position', 'display_order', '-created_at']

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """
        Bulk reorder banners. Expects: { "order": [{ "id": 1, "display_order": 0 }, ...] }
        """
        order_data = request.data.get('order', [])
        for item in order_data:
            Banner.objects.filter(id=item.get('id')).update(display_order=item.get('display_order', 0))
        return Response({'status': 'Banners reordered successfully'})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get banner statistics."""
        from django.utils import timezone
        now = timezone.now()
        total = Banner.objects.count()
        active = Banner.objects.filter(is_active=True).count()
        scheduled = Banner.objects.filter(start_date__gt=now).count()
        expired = Banner.objects.filter(end_date__lt=now, end_date__isnull=False).count()

        # Count by position
        position_counts = {}
        for choice_val, choice_label in Banner.POSITION_CHOICES:
            position_counts[choice_val] = Banner.objects.filter(position=choice_val, is_active=True).count()

        return Response({
            'total': total,
            'active': active,
            'inactive': total - active,
            'scheduled': scheduled,
            'expired': expired,
            'by_position': position_counts,
        })


class AdminPromoCodeViewSet(viewsets.ModelViewSet):
    """
    Admin-only ViewSet for managing promo / discount codes.
    """
    queryset = PromoCode.objects.all()
    serializer_class = PromoCodeSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrStaff]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'description']
    ordering_fields = ['created_at', 'valid_to', 'discount_value']
    ordering = ['-created_at']

    def perform_create(self, serializer):
        from django.db import IntegrityError
        try:
            serializer.save()
        except IntegrityError as e:
            if 'code' in str(e).lower():
                raise serializers.ValidationError({'code': 'A promo code with this code already exists.'})
            raise serializers.ValidationError({'error': f'Database error: {str(e)}'})

    def perform_update(self, serializer):
        from django.db import IntegrityError
        try:
            serializer.save()
        except IntegrityError as e:
            if 'code' in str(e).lower():
                raise serializers.ValidationError({'code': 'A promo code with this code already exists.'})
            raise serializers.ValidationError({'error': f'Database error: {str(e)}'})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get promo code statistics."""
        from django.utils import timezone
        now = timezone.now()
        total = PromoCode.objects.count()
        active = PromoCode.objects.filter(is_active=True).count()
        expired = PromoCode.objects.filter(valid_to__lt=now, valid_to__isnull=False).count()
        total_used = sum(p.times_used for p in PromoCode.objects.all())
        return Response({
            'total': total,
            'active': active,
            'expired': expired,
            'total_used': total_used,
        })


class AdminOfflinePaymentViewSet(viewsets.ModelViewSet):
    """
    Admin-only ViewSet for managing offline store payments.
    """
    queryset = OfflinePayment.objects.all()
    serializer_class = OfflinePaymentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrStaff]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['customer_name', 'note']
    ordering_fields = ['created_at', 'amount']
    ordering = ['-created_at']

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get offline payment statistics."""
        from django.db.models import Sum
        total = OfflinePayment.objects.count()
        received = OfflinePayment.objects.filter(status='received').count()
        pending = OfflinePayment.objects.filter(status='pending').count()
        total_amount = OfflinePayment.objects.filter(status='received').aggregate(total=Sum('amount'))['total'] or 0
        return Response({
            'total': total,
            'received': received,
            'pending': pending,
            'total_amount': float(total_amount),
        })

    @action(detail=False, methods=['post'])
    def settle(self, request):
        """
        Settle pending offline payments up to a given amount.
        Marks pending payments as 'received' (oldest first).
        Expects: { "amount": 1500.00 }
        """
        from decimal import Decimal, InvalidOperation
        from django.db.models import Sum
        from django.db.models.functions import Coalesce

        try:
            settle_amount = Decimal(str(request.data.get('amount', '0')))
        except (InvalidOperation, ValueError, TypeError):
            return Response({'error': 'Invalid amount'}, status=400)

        if settle_amount <= 0:
            return Response({'error': 'Amount must be greater than 0'}, status=400)

        # Get pending payments, oldest first
        pending_payments = OfflinePayment.objects.filter(status='pending').order_by('created_at')

        total_pending = pending_payments.aggregate(
            total=Coalesce(Sum('amount'), Decimal('0'))
        )['total']

        if settle_amount > total_pending:
            return Response({
                'error': f'Settlement amount (₹{settle_amount}) exceeds total pending (₹{total_pending})'
            }, status=400)

        remaining = settle_amount
        settled_count = 0
        settled_ids = []

        for payment in pending_payments:
            if remaining <= 0:
                break
            if payment.amount <= remaining:
                # Fully settle this payment
                payment.status = 'received'
                payment.save()
                remaining -= payment.amount
                settled_count += 1
                settled_ids.append(payment.id)
            else:
                # Partially settle — mark the full payment as received
                # since user specified this amount to settle
                payment.status = 'received'
                payment.save()
                settled_count += 1
                settled_ids.append(payment.id)
                remaining = Decimal('0')

        return Response({
            'settled_amount': str(settle_amount),
            'settled_count': settled_count,
            'settled_ids': settled_ids,
            'message': f'Successfully settled ₹{settle_amount} across {settled_count} payment(s)',
        })


class FinanceDataView(APIView):
    """
    Returns real finance data for the admin Finance & Compliance page.
    Replaces all approximation-based calculations with actual DB queries.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminOrStaff]

    def get(self, request):
        from django.db.models import Sum, Count
        from django.db.models.functions import Coalesce
        from decimal import Decimal
        from apps.orders.models import Order, Refund

        # ── GST Collected (Online) — from paid orders' tax_total ──
        gst_online = Order.objects.filter(is_paid=True).aggregate(
            total=Coalesce(Sum('tax_total'), Decimal('0'))
        )['total']

        # ── GST Collected (Offline) — from offline payments' gst_amount ──
        gst_offline = OfflinePayment.objects.filter(status='received').aggregate(
            total=Coalesce(Sum('gst_amount'), Decimal('0'))
        )['total']

        # ── Pending Settlements — offline payments with status=pending ──
        pending_settlement = OfflinePayment.objects.filter(status='pending').aggregate(
            total=Coalesce(Sum('amount'), Decimal('0'))
        )['total']
        pending_settlement_count = OfflinePayment.objects.filter(status='pending').count()

        # ── Refunds ──
        refunds_completed = Refund.objects.filter(status='Completed').aggregate(
            total=Coalesce(Sum('amount'), Decimal('0'))
        )['total']
        refunds_pending = Refund.objects.filter(status__in=['Pending', 'Processing']).aggregate(
            total=Coalesce(Sum('amount'), Decimal('0'))
        )['total']
        refund_count = Refund.objects.filter(status='Completed').count()

        # ── Total Revenue (online) ──
        total_revenue = Order.objects.filter(is_paid=True).aggregate(
            total=Coalesce(Sum('total_amount'), Decimal('0'))
        )['total']

        # ── Total Offline Revenue ──
        total_offline_revenue = OfflinePayment.objects.filter(status='received').aggregate(
            total=Coalesce(Sum('amount'), Decimal('0'))
        )['total']

        # ── Refunded Orders count ──
        refunded_orders = Order.objects.filter(status='Refunded').count()

        return Response({
            'gst_collected_online': str(gst_online),
            'gst_collected_offline': str(gst_offline),
            'pending_settlement': str(pending_settlement),
            'pending_settlement_count': pending_settlement_count,
            'refunds_completed': str(refunds_completed),
            'refunds_pending': str(refunds_pending),
            'refund_count': refund_count,
            'refunded_orders': refunded_orders,
            'total_revenue_online': str(total_revenue),
            'total_revenue_offline': str(total_offline_revenue),
        })
