"""
Admin Views for Orders, Analytics, Dashboard Stats, and Marketing Campaigns.
Provides comprehensive analytics endpoints for the admin dashboard.
"""
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import (
    Count, Sum, Avg, F, Q, Value, CharField,
    DecimalField, IntegerField
)
from django.db.models.functions import (
    TruncDate, TruncWeek, TruncMonth, Coalesce, ExtractMonth, ExtractYear
)
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from .models import (
    Order, OrderItem, OrderStatusHistory, Invoice,
    ReturnRequest, Refund, Shipment, InstamojoTransaction, PaymentLog,
)
from .serializers import (
    OrderSerializer, OrderItemSerializer, OrderStatusHistorySerializer,
    InvoiceSerializer, ReturnRequestSerializer, RefundSerializer,
    ShipmentSerializer,
)
from apps.users.permissions import IsAdminOrStaff


class AdminOrderViewSet(viewsets.ModelViewSet):
    """
    Admin-only ViewSet for managing ALL orders.
    Supports search, filtering, status transitions, and bulk operations.
    """
    queryset = Order.objects.all().select_related(
        'user', 'shipping_address'
    ).prefetch_related(
        'items__product', 'shipment', 'invoice',
        'status_history', 'return_requests', 'refunds'
    )
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrStaff]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['id', 'user__username', 'user__email', 'status', 'transaction_id']
    ordering_fields = ['created_at', 'total_amount', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)

        # Filter by payment status
        is_paid = self.request.query_params.get('is_paid')
        if is_paid is not None:
            queryset = queryset.filter(is_paid=is_paid == 'true')

        return queryset

    @action(detail=True, methods=['post'], url_path='transition')
    def transition_status(self, request, pk=None):
        """Admin transitions an order to a new status."""
        order = self.get_object()
        new_status = request.data.get('new_status')
        note = request.data.get('note', '')

        if not new_status:
            return Response({'error': 'new_status is required'}, status=status.HTTP_400_BAD_REQUEST)

        if not order.can_transition_to(new_status):
            allowed = Order.VALID_TRANSITIONS.get(order.status, [])
            return Response({
                'error': f"Cannot transition from '{order.status}' to '{new_status}'.",
                'allowed_transitions': allowed,
            }, status=status.HTTP_400_BAD_REQUEST)

        order.transition_status(new_status, changed_by=request.user, note=note)

        # Auto-generate invoice when transitioning to Paid
        if new_status == 'Paid':
            self._create_invoice(order)

        return Response(OrderSerializer(order, context={'request': request}).data)

    def _create_invoice(self, order):
        """Create invoice when order is paid."""
        from .invoice_generator import generate_invoice_pdf
        if hasattr(order, 'invoice'):
            return order.invoice
        invoice = Invoice.objects.create(
            order=order,
            subtotal=order.subtotal,
            tax_total=order.tax_total,
            shipping_total=order.shipping_total,
            discount_total=order.discount_total,
            grand_total=order.total_amount,
        )
        try:
            generate_invoice_pdf(invoice)
        except Exception:
            pass
        return invoice

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Comprehensive order statistics for the dashboard."""
        now = timezone.now()
        today = now.date()
        thirty_days_ago = now - timedelta(days=30)
        seven_days_ago = now - timedelta(days=7)

        total_orders = Order.objects.count()
        orders_today = Order.objects.filter(created_at__date=today).count()
        orders_this_week = Order.objects.filter(created_at__gte=seven_days_ago).count()
        orders_this_month = Order.objects.filter(created_at__gte=thirty_days_ago).count()

        # Status breakdown
        status_breakdown = dict(
            Order.objects.values_list('status')
            .annotate(count=Count('id'))
            .values_list('status', 'count')
        )

        # Revenue
        total_revenue = Order.objects.filter(is_paid=True).aggregate(
            total=Coalesce(Sum('total_amount'), Decimal('0'))
        )['total']

        revenue_today = Order.objects.filter(
            is_paid=True, paid_at__date=today
        ).aggregate(total=Coalesce(Sum('total_amount'), Decimal('0')))['total']

        revenue_this_month = Order.objects.filter(
            is_paid=True, paid_at__gte=thirty_days_ago
        ).aggregate(total=Coalesce(Sum('total_amount'), Decimal('0')))['total']

        # Average order value
        avg_order_value = Order.objects.filter(is_paid=True).aggregate(
            avg=Coalesce(Avg('total_amount'), Decimal('0'))
        )['avg']

        # Cancellation rate
        cancelled = Order.objects.filter(status='Cancelled').count()
        cancellation_rate = round((cancelled / total_orders * 100), 1) if total_orders > 0 else 0

        # Pending orders
        pending_orders = Order.objects.filter(status='Pending').count()

        return Response({
            'total_orders': total_orders,
            'orders_today': orders_today,
            'orders_this_week': orders_this_week,
            'orders_this_month': orders_this_month,
            'status_breakdown': status_breakdown,
            'total_revenue': str(total_revenue),
            'revenue_today': str(revenue_today),
            'revenue_this_month': str(revenue_this_month),
            'avg_order_value': str(round(avg_order_value, 2)),
            'cancellation_rate': cancellation_rate,
            'pending_orders': pending_orders,
        })

    @action(detail=False, methods=['get'], url_path='revenue-chart')
    def revenue_chart(self, request):
        """Revenue data for charts. Supports daily/weekly/monthly grouping."""
        period = request.query_params.get('period', 'daily')  # daily, weekly, monthly
        days = int(request.query_params.get('days', 30))

        start_date = timezone.now() - timedelta(days=days)
        orders = Order.objects.filter(is_paid=True, paid_at__gte=start_date)

        if period == 'monthly':
            data = orders.annotate(
                period=TruncMonth('paid_at')
            ).values('period').annotate(
                revenue=Sum('total_amount'),
                count=Count('id')
            ).order_by('period')
        elif period == 'weekly':
            data = orders.annotate(
                period=TruncWeek('paid_at')
            ).values('period').annotate(
                revenue=Sum('total_amount'),
                count=Count('id')
            ).order_by('period')
        else:
            data = orders.annotate(
                period=TruncDate('paid_at')
            ).values('period').annotate(
                revenue=Sum('total_amount'),
                count=Count('id')
            ).order_by('period')

        chart_data = [
            {
                'date': str(item['period']),
                'revenue': str(item['revenue']),
                'orders': item['count'],
            }
            for item in data
        ]

        return Response(chart_data)

    @action(detail=False, methods=['get'], url_path='status-chart')
    def status_chart(self, request):
        """Order status distribution for bar chart."""
        data = (
            Order.objects.values('status')
            .annotate(count=Count('id'))
            .order_by('status')
        )
        return Response(list(data))


class DashboardAnalyticsView(APIView):
    """
    Comprehensive dashboard analytics endpoint.
    Returns all stats in a single API call for the dashboard page.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminOrStaff]

    def get(self, request):
        now = timezone.now()
        today = now.date()
        thirty_days_ago = now - timedelta(days=30)
        prev_thirty_days = now - timedelta(days=60)

        # ── Order Stats ──
        total_orders = Order.objects.count()
        pending_orders = Order.objects.filter(status='Pending').count()
        cancelled = Order.objects.filter(status='Cancelled').count()
        cancellation_rate = round((cancelled / total_orders * 100), 1) if total_orders > 0 else 0

        # ── Revenue ──
        total_revenue = Order.objects.filter(is_paid=True).aggregate(
            total=Coalesce(Sum('total_amount'), Decimal('0'))
        )['total']

        current_month_revenue = Order.objects.filter(
            is_paid=True, paid_at__gte=thirty_days_ago
        ).aggregate(total=Coalesce(Sum('total_amount'), Decimal('0')))['total']

        prev_month_revenue = Order.objects.filter(
            is_paid=True,
            paid_at__gte=prev_thirty_days,
            paid_at__lt=thirty_days_ago
        ).aggregate(total=Coalesce(Sum('total_amount'), Decimal('0')))['total']

        revenue_growth = 0
        if prev_month_revenue and prev_month_revenue > 0:
            revenue_growth = round(
                ((current_month_revenue - prev_month_revenue) / prev_month_revenue * 100), 1
            )

        avg_order_value = Order.objects.filter(is_paid=True).aggregate(
            avg=Coalesce(Avg('total_amount'), Decimal('0'))
        )['avg']

        # ── User Stats ──
        from django.contrib.auth import get_user_model
        User = get_user_model()
        total_users = User.objects.count()
        new_users_this_month = User.objects.filter(
            date_joined__gte=thirty_days_ago
        ).count()

        # ── Order Status Distribution (for bar chart) ──
        status_distribution = list(
            Order.objects.values('status')
            .annotate(value=Count('id'))
            .order_by('status')
        )

        # ── Product by Category (for pie chart) ──
        from apps.catalog.models import Product, Category
        category_distribution = list(
            Product.objects.filter(is_active=True)
            .values(name=F('subcategory__category__name'))
            .annotate(value=Count('id'))
            .order_by('-value')[:8]
        )

        # ── New vs Repeated Customers ──
        users_with_orders = Order.objects.filter(is_paid=True).values('user').annotate(
            order_count=Count('id')
        )
        new_customers = users_with_orders.filter(order_count=1).count()
        repeated_customers = users_with_orders.filter(order_count__gt=1).count()

        # ── Most & Least Selling Products ──
        most_selling = list(
            OrderItem.objects.filter(order__is_paid=True)
            .values('product__name')
            .annotate(
                orders=Sum('quantity'),
                revenue=Sum('total_price')
            )
            .order_by('-orders')[:5]
        )
        for item in most_selling:
            item['name'] = item.pop('product__name')
            item['revenue'] = str(item['revenue'])

        least_selling = list(
            OrderItem.objects.filter(order__is_paid=True)
            .values('product__name')
            .annotate(
                orders=Sum('quantity'),
                revenue=Sum('total_price')
            )
            .order_by('orders')[:5]
        )
        for item in least_selling:
            item['name'] = item.pop('product__name')
            item['revenue'] = str(item['revenue'])

        # ── Daily Revenue (last 30 days for chart) ──
        daily_revenue = list(
            Order.objects.filter(is_paid=True, paid_at__gte=thirty_days_ago)
            .annotate(date=TruncDate('paid_at'))
            .values('date')
            .annotate(revenue=Sum('total_amount'), count=Count('id'))
            .order_by('date')
        )
        for item in daily_revenue:
            item['date'] = str(item['date'])
            item['revenue'] = str(item['revenue'])

        # ── Low Stock Products ──
        low_stock_products = list(
            Product.objects.filter(
                stock_quantity__lt=10,
                is_infinite_stock=False,
                is_active=True
            ).values('id', 'name', 'sku', 'stock_quantity')[:10]
        )

        return Response({
            # Stat cards
            'total_orders': total_orders,
            'pending_orders': pending_orders,
            'avg_order_value': str(round(avg_order_value, 2)),
            'cancellation_rate': cancellation_rate,
            'total_revenue': str(total_revenue),
            'revenue_growth': revenue_growth,
            'total_users': total_users,
            'new_users_this_month': new_users_this_month,

            # Charts
            'status_distribution': status_distribution,
            'category_distribution': category_distribution,
            'new_vs_repeated': {
                'new': new_customers,
                'repeated': repeated_customers,
            },
            'daily_revenue': daily_revenue,

            # Tables
            'most_selling': most_selling,
            'least_selling': least_selling,
            'low_stock_products': low_stock_products,
        })


class UserAnalyticsView(APIView):
    """User analytics: registrations over time, activity, cohorts."""
    permission_classes = [permissions.IsAuthenticated, IsAdminOrStaff]

    def get(self, request):
        from django.contrib.auth import get_user_model
        User = get_user_model()

        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        sixty_days_ago = now - timedelta(days=60)

        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        verified_users = User.objects.filter(is_verified=True).count()

        # Registration trend (daily, last 30 days)
        registrations = list(
            User.objects.filter(date_joined__gte=thirty_days_ago)
            .annotate(date=TruncDate('date_joined'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )
        for item in registrations:
            item['date'] = str(item['date'])

        # Monthly registrations (last 12 months)
        monthly_registrations = list(
            User.objects.filter(date_joined__gte=now - timedelta(days=365))
            .annotate(month=TruncMonth('date_joined'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )
        for item in monthly_registrations:
            item['month'] = str(item['month'])

        # Users by order count (segmentation)
        users_with_orders = (
            User.objects.annotate(order_count=Count('orders'))
            .values('order_count')
            .annotate(user_count=Count('id'))
            .order_by('order_count')
        )
        segments = {'no_orders': 0, 'one_order': 0, 'two_to_five': 0, 'six_plus': 0}
        for item in users_with_orders:
            oc = item['order_count']
            uc = item['user_count']
            if oc == 0:
                segments['no_orders'] += uc
            elif oc == 1:
                segments['one_order'] += uc
            elif 2 <= oc <= 5:
                segments['two_to_five'] += uc
            else:
                segments['six_plus'] += uc

        # Growth rate
        current_new = User.objects.filter(date_joined__gte=thirty_days_ago).count()
        prev_new = User.objects.filter(
            date_joined__gte=sixty_days_ago,
            date_joined__lt=thirty_days_ago
        ).count()
        growth_rate = 0
        if prev_new > 0:
            growth_rate = round(((current_new - prev_new) / prev_new * 100), 1)

        # Top customers by spend
        top_customers = list(
            User.objects.annotate(
                total_spent=Coalesce(
                    Sum('orders__total_amount', filter=Q(orders__is_paid=True)),
                    Decimal('0')
                ),
                order_count=Count('orders', filter=Q(orders__is_paid=True))
            ).filter(total_spent__gt=0)
            .order_by('-total_spent')[:10]
            .values('id', 'username', 'email', 'total_spent', 'order_count')
        )
        for item in top_customers:
            item['total_spent'] = str(item['total_spent'])

        return Response({
            'total_users': total_users,
            'active_users': active_users,
            'verified_users': verified_users,
            'growth_rate': growth_rate,
            'registrations_daily': registrations,
            'registrations_monthly': monthly_registrations,
            'segments': segments,
            'top_customers': top_customers,
        })


class ProductAnalyticsView(APIView):
    """Product analytics: performance, stock, views, conversion."""
    permission_classes = [permissions.IsAuthenticated, IsAdminOrStaff]

    def get(self, request):
        from apps.catalog.models import Product, Category

        # Top products by orders
        top_by_orders = list(
            OrderItem.objects.filter(order__is_paid=True)
            .values('product__id', 'product__name', 'product__sku', 'product__primary_image')
            .annotate(
                total_orders=Sum('quantity'),
                total_revenue=Sum('total_price')
            )
            .order_by('-total_orders')[:10]
        )
        for item in top_by_orders:
            item['total_revenue'] = str(item['total_revenue'])

        # Top by revenue
        top_by_revenue = list(
            OrderItem.objects.filter(order__is_paid=True)
            .values('product__id', 'product__name', 'product__sku')
            .annotate(
                total_revenue=Sum('total_price'),
                total_orders=Sum('quantity')
            )
            .order_by('-total_revenue')[:10]
        )
        for item in top_by_revenue:
            item['total_revenue'] = str(item['total_revenue'])

        # Products by views (highest view_count)
        most_viewed = list(
            Product.objects.filter(is_active=True)
            .order_by('-view_count')[:10]
            .values('id', 'name', 'sku', 'view_count', 'order_count', 'base_price')
        )
        for item in most_viewed:
            item['base_price'] = str(item['base_price'])
            # Conversion rate: orders / views
            if item['view_count'] > 0:
                item['conversion_rate'] = round((item['order_count'] / item['view_count'] * 100), 2)
            else:
                item['conversion_rate'] = 0

        # Category performance
        category_performance = list(
            OrderItem.objects.filter(order__is_paid=True)
            .values(category=F('product__subcategory__category__name'))
            .annotate(
                total_orders=Sum('quantity'),
                total_revenue=Sum('total_price')
            )
            .order_by('-total_revenue')
        )
        for item in category_performance:
            item['total_revenue'] = str(item['total_revenue'])

        # Stock summary
        total_products = Product.objects.count()
        active_products = Product.objects.filter(is_active=True).count()
        low_stock = Product.objects.filter(
            stock_quantity__lt=10, is_infinite_stock=False
        ).count()
        out_of_stock = Product.objects.filter(
            stock_quantity=0, is_infinite_stock=False
        ).count()

        return Response({
            'top_by_orders': top_by_orders,
            'top_by_revenue': top_by_revenue,
            'most_viewed': most_viewed,
            'category_performance': category_performance,
            'stock_summary': {
                'total': total_products,
                'active': active_products,
                'low_stock': low_stock,
                'out_of_stock': out_of_stock,
            },
        })


class StockAlertView(APIView):
    """Stock monitoring and alerts for admin."""
    permission_classes = [permissions.IsAuthenticated, IsAdminOrStaff]

    def get(self, request):
        from apps.catalog.models import Product

        threshold = int(request.query_params.get('threshold', 10))

        # Low stock products
        low_stock = list(
            Product.objects.filter(
                stock_quantity__lte=threshold,
                is_infinite_stock=False,
                is_active=True
            ).order_by('stock_quantity')
            .values(
                'id', 'name', 'sku', 'stock_quantity',
                'base_price', 'primary_image',
                category_name=F('subcategory__category__name'),
                subcategory_name=F('subcategory__name'),
            )
        )
        for item in low_stock:
            item['base_price'] = str(item['base_price'])

        # Out of stock
        out_of_stock = list(
            Product.objects.filter(
                stock_quantity=0,
                is_infinite_stock=False,
                is_active=True
            ).values(
                'id', 'name', 'sku', 'primary_image',
                category_name=F('subcategory__category__name'),
            )
        )

        # Stock value (total inventory value)
        from django.db.models import ExpressionWrapper
        stock_value = Product.objects.filter(
            is_infinite_stock=False, is_active=True
        ).aggregate(
            total_value=Coalesce(
                Sum(
                    ExpressionWrapper(
                        F('stock_quantity') * F('base_price'),
                        output_field=DecimalField()
                    )
                ),
                Decimal('0')
            ),
            total_items=Coalesce(Sum('stock_quantity'), 0)
        )

        return Response({
            'low_stock': low_stock,
            'out_of_stock': out_of_stock,
            'threshold': threshold,
            'low_stock_count': len(low_stock),
            'out_of_stock_count': len(out_of_stock),
            'total_stock_value': str(stock_value['total_value']),
            'total_stock_items': stock_value['total_items'],
        })

    def post(self, request):
        """Bulk update stock for multiple products."""
        from apps.catalog.models import Product

        updates = request.data.get('updates', [])
        updated = 0
        for update in updates:
            product_id = update.get('id')
            new_stock = update.get('stock_quantity')
            if product_id is not None and new_stock is not None:
                Product.objects.filter(id=product_id).update(stock_quantity=new_stock)
                updated += 1

        return Response({'status': 'success', 'updated': updated})
