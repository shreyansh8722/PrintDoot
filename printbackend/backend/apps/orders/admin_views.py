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
    Returns all stats in a single API call for the admin dashboard page.
    Matches the admin dashboard image design with:
    - Top stat cards (Orders, Sales & Analytics, Total Customers, Reviews)
    - Second row cards (Comparison Reports, Sale Event, Total Payments, Expense Payment)
    - Product Performance section with SKU-level details
    - Stocks donut chart & Monthly New Customer Reports pie chart
    - Alerts section (Low Inventory, Out of Stock, Slow Moving SKUs)
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

        # ── Revenue / Payments ──
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

        # Total payments (sum of all paid orders)
        total_payments = total_revenue

        # Expense payment (shipping + tax totals as proxy for expenses)
        expense_payment = Order.objects.filter(is_paid=True).aggregate(
            shipping=Coalesce(Sum('shipping_total'), Decimal('0')),
            tax=Coalesce(Sum('tax_total'), Decimal('0')),
            discount=Coalesce(Sum('discount_total'), Decimal('0')),
        )
        total_expense = expense_payment['shipping'] + expense_payment['tax'] + expense_payment['discount']

        # ── User / Customer Stats ──
        from django.contrib.auth import get_user_model
        User = get_user_model()
        total_users = User.objects.count()
        new_users_this_month = User.objects.filter(
            date_joined__gte=thirty_days_ago
        ).count()

        # ── Reviews Stats ──
        from apps.catalog.models import ProductReview
        total_reviews = ProductReview.objects.count()

        # ── Sale Event (current month orders count as "sale event" metric) ──
        current_month_orders = Order.objects.filter(
            created_at__gte=thirty_days_ago
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
            .values(category_name=F('subcategory__category__name'))
            .annotate(value=Count('id'))
            .order_by('-value')[:8]
        )
        # Rename key for frontend compatibility
        category_distribution = [
            {'name': item['category_name'], 'value': item['value']}
            for item in category_distribution
        ]

        # ── New vs Repeated Customers ──
        users_with_orders = Order.objects.filter(is_paid=True).values('user').annotate(
            order_count=Count('id')
        )
        new_customers = users_with_orders.filter(order_count=1).count()
        repeated_customers = users_with_orders.filter(order_count__gt=1).count()

        # ── Product Performance Stats ──
        total_active_skus = Product.objects.filter(is_active=True).count()

        # Top selling SKU (from orders, or fall back to any active product SKU)
        top_selling_sku_data = (
            OrderItem.objects.filter(order__is_paid=True)
            .values('product__sku')
            .annotate(total_sold=Sum('quantity'))
            .order_by('-total_sold')
            .first()
        )
        if top_selling_sku_data:
            top_selling_sku = top_selling_sku_data['product__sku']
        else:
            # Fall back to the first active product's SKU
            active_product = Product.objects.filter(is_active=True).first()
            top_selling_sku = active_product.sku if active_product else 'N/A'

        # Low performing SKU count (ordered less than 5 times)
        low_performing_sku_count = Product.objects.filter(
            is_active=True, order_count__lt=5
        ).count()

        # Stock alerts count
        stock_alerts_count = Product.objects.filter(
            stock_quantity__lte=10,
            is_infinite_stock=False,
            is_active=True
        ).count()

        # ── Product Details Table (SKU-level with sales, margin, customization, inventory, status) ──
        from django.db.models import ExpressionWrapper
        product_details = []
        top_products = (
            OrderItem.objects.filter(order__is_paid=True)
            .values('product__sku', 'product__name', 'product__base_price', 'product__stock_quantity', 'product__is_infinite_stock')
            .annotate(
                total_sales=Sum('total_price'),
                units_sold=Sum('quantity'),
            )
            .order_by('-total_sales')[:10]
        )
        for p in top_products:
            sales = p['total_sales'] or Decimal('0')
            units = p['units_sold'] or 0
            base_price = p['product__base_price'] or Decimal('0')
            cost_estimate = base_price * Decimal('0.6')  # estimated cost ~60% of price
            margin_pct = round(((base_price - cost_estimate) / base_price * 100), 0) if base_price > 0 else 0

            stock_qty = p['product__stock_quantity']
            is_infinite = p['product__is_infinite_stock']

            if is_infinite:
                stock_status = 'In Stock'
                inventory = '∞'
                notes = 'Print on Demand'
            elif stock_qty > 20:
                stock_status = 'In Stock'
                inventory = stock_qty
                notes = 'High demand' if units > 50 else 'Moderate demand'
            elif stock_qty > 0:
                stock_status = 'Low Stock'
                inventory = stock_qty
                notes = 'Needs restocking'
            else:
                stock_status = 'Out of Stock'
                inventory = 0
                notes = 'Restocking' if units > 10 else 'Discontinued'

            # Customization % (items with design / total items)
            total_items_for_sku = OrderItem.objects.filter(
                product__sku=p['product__sku'], order__is_paid=True
            ).count()
            customized_items = OrderItem.objects.filter(
                product__sku=p['product__sku'], order__is_paid=True
            ).exclude(
                Q(zakeke_design_id='') | Q(zakeke_design_id__isnull=True)
            ).count()
            customization_pct = round((customized_items / total_items_for_sku * 100), 0) if total_items_for_sku > 0 else 0

            product_details.append({
                'sku': p['product__sku'],
                'sales': str(sales),
                'units_sold': units,
                'margin_pct': int(margin_pct),
                'customization_pct': int(customization_pct),
                'inventory': inventory,
                'status': stock_status,
                'notes': notes,
            })

        # ── Stock Chart Data (donut chart) ──
        in_stock_count = Product.objects.filter(
            is_active=True
        ).filter(
            Q(is_infinite_stock=True) | Q(stock_quantity__gt=10)
        ).count()
        limited_stock_count = Product.objects.filter(
            is_active=True, is_infinite_stock=False,
            stock_quantity__gt=0, stock_quantity__lte=10
        ).count()
        out_of_stock_count = Product.objects.filter(
            is_active=True, is_infinite_stock=False, stock_quantity=0
        ).count()

        stocks_chart = [
            {'name': 'In Stocks', 'value': in_stock_count},
            {'name': 'Limited stocks', 'value': limited_stock_count},
            {'name': 'Out of Stocks', 'value': out_of_stock_count},
        ]

        # ── Monthly New Customer Reports (last 12 months) ──
        monthly_new_customers = []
        month_names = ['Jan', 'Feb', 'Mar', 'April', 'May', 'June',
                       'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        monthly_data = (
            User.objects.filter(date_joined__gte=now - timedelta(days=365))
            .annotate(month=ExtractMonth('date_joined'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )
        month_dict = {item['month']: item['count'] for item in monthly_data}
        for m in range(1, 13):
            monthly_new_customers.append({
                'name': month_names[m - 1],
                'value': month_dict.get(m, 0),
            })

        # ── Alerts ──
        # Low inventory alerts (stock between 1 and 10)
        low_inventory_products = list(
            Product.objects.filter(
                stock_quantity__gt=0,
                stock_quantity__lte=10,
                is_infinite_stock=False,
                is_active=True
            ).values_list('sku', flat=True)[:10]
        )

        # Out of stock alerts
        out_of_stock_products = list(
            Product.objects.filter(
                stock_quantity=0,
                is_infinite_stock=False,
                is_active=True
            ).values_list('sku', flat=True)[:10]
        )

        # Slow moving SKUs (active products with very few orders)
        slow_moving_skus = list(
            Product.objects.filter(
                is_active=True, order_count__lte=2
            ).exclude(is_infinite_stock=True)
            .order_by('order_count')
            .values_list('sku', flat=True)[:5]
        )

        # ── Most & Least Selling Products (legacy support) ──
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

        # ── Low Stock Products (legacy) ──
        low_stock_products = list(
            Product.objects.filter(
                stock_quantity__lt=10,
                is_infinite_stock=False,
                is_active=True
            ).values('id', 'name', 'sku', 'stock_quantity')[:10]
        )

        return Response({
            # Row 1: Top stat cards
            'total_orders': total_orders,
            'pending_orders': pending_orders,
            'total_revenue': str(total_revenue),
            'revenue_growth': revenue_growth,
            'total_users': total_users,
            'new_users_this_month': new_users_this_month,
            'total_reviews': total_reviews,

            # Row 2: Secondary stat cards
            'current_month_orders': current_month_orders,
            'total_payments': str(total_payments),
            'expense_payment': str(total_expense),
            'avg_order_value': str(round(avg_order_value, 2)),
            'cancellation_rate': cancellation_rate,

            # Product Performance
            'total_active_skus': total_active_skus,
            'top_selling_sku': top_selling_sku,
            'low_performing_sku_count': low_performing_sku_count,
            'stock_alerts_count': stock_alerts_count,
            'product_details': product_details,

            # Charts
            'status_distribution': status_distribution,
            'category_distribution': category_distribution,
            'new_vs_repeated': {
                'new': new_customers,
                'repeated': repeated_customers,
            },
            'daily_revenue': daily_revenue,
            'stocks_chart': stocks_chart,
            'monthly_new_customers': monthly_new_customers,

            # Alerts
            'alerts': {
                'low_inventory': low_inventory_products,
                'out_of_stock': out_of_stock_products,
                'slow_moving': slow_moving_skus,
            },

            # Tables (legacy)
            'most_selling': most_selling,
            'least_selling': least_selling,
            'low_stock_products': low_stock_products,
        })


class SalesOrderAnalyticsView(APIView):
    """
    Comprehensive Sales & Order Analytics endpoint.
    Returns data for the Sales Order Analytics admin page:
    - Stat cards (Total Sales, Total Orders, Avg Order Value, Cancellation Rate)
    - Chart Insights (Order by dates bar, Product by category pie, New vs Repeated donut)
    - Monthly Sales Trend (12 months revenue + orders)
    - Order Fulfillment Status breakdown
    - Monthly Targets & Performance
    - Most & Least Selling Products with details
    - Recent Orders table
    - Top insights (categories, payment methods)
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminOrStaff]

    def get(self, request):
        from django.contrib.auth import get_user_model
        from apps.catalog.models import Product, Category
        User = get_user_model()

        now = timezone.now()
        today = now.date()
        thirty_days_ago = now - timedelta(days=30)
        prev_thirty_days = now - timedelta(days=60)
        one_year_ago = now - timedelta(days=365)

        # ── Stat Cards ──
        total_orders = Order.objects.count()
        total_revenue = Order.objects.filter(is_paid=True).aggregate(
            total=Coalesce(Sum('total_amount'), Decimal('0'))
        )['total']
        avg_order_value = Order.objects.filter(is_paid=True).aggregate(
            avg=Coalesce(Avg('total_amount'), Decimal('0'))
        )['avg']
        pending_orders = Order.objects.filter(status='Pending').count()
        cancelled_orders = Order.objects.filter(status='Cancelled').count()
        cancellation_rate = round((cancelled_orders / total_orders * 100), 1) if total_orders > 0 else 0
        delivered_orders = Order.objects.filter(status='Delivered').count()
        total_customers = User.objects.filter(orders__isnull=False).distinct().count()

        # Revenue growth
        current_month_revenue = Order.objects.filter(
            is_paid=True, paid_at__gte=thirty_days_ago
        ).aggregate(total=Coalesce(Sum('total_amount'), Decimal('0')))['total']
        prev_month_revenue = Order.objects.filter(
            is_paid=True, paid_at__gte=prev_thirty_days, paid_at__lt=thirty_days_ago
        ).aggregate(total=Coalesce(Sum('total_amount'), Decimal('0')))['total']
        revenue_growth = 0
        if prev_month_revenue and prev_month_revenue > 0:
            revenue_growth = round(((current_month_revenue - prev_month_revenue) / prev_month_revenue * 100), 1)

        # Orders this month
        orders_this_month = Order.objects.filter(created_at__gte=thirty_days_ago).count()

        # ── Chart Insight 1: Orders by Date (last 30 days) ──
        orders_by_date = list(
            Order.objects.filter(created_at__gte=thirty_days_ago)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )
        for item in orders_by_date:
            item['date'] = str(item['date'])

        # ── Chart Insight 2: Products by Category (pie) ──
        category_distribution = list(
            Product.objects.filter(is_active=True)
            .values(category_name=F('subcategory__category__name'))
            .annotate(value=Count('id'))
            .order_by('-value')[:8]
        )
        category_distribution = [
            {'name': item['category_name'] or 'Uncategorized', 'value': item['value']}
            for item in category_distribution
        ]

        # ── Chart Insight 3: New vs Repeated Customers (donut) ──
        users_with_orders = Order.objects.values('user').annotate(order_count=Count('id'))
        new_customers = users_with_orders.filter(order_count=1).count()
        repeated_customers = users_with_orders.filter(order_count__gt=1).count()

        # ── Monthly Sales Trend (last 12 months) ──
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        monthly_sales_data = list(
            Order.objects.filter(created_at__gte=one_year_ago)
            .annotate(month=ExtractMonth('created_at'), year=ExtractYear('created_at'))
            .values('month', 'year')
            .annotate(
                orders=Count('id'),
                revenue=Coalesce(Sum('total_amount', filter=Q(is_paid=True)), Decimal('0'))
            )
            .order_by('year', 'month')
        )
        monthly_sales_trend = []
        for item in monthly_sales_data:
            monthly_sales_trend.append({
                'name': month_names[item['month'] - 1],
                'month': item['month'],
                'year': item['year'],
                'orders': item['orders'],
                'revenue': str(item['revenue']),
            })
        # If no data, fill with empty months
        if not monthly_sales_trend:
            current_month = now.month
            for i in range(12):
                m = ((current_month - 12 + i) % 12) + 1
                monthly_sales_trend.append({
                    'name': month_names[m - 1],
                    'month': m,
                    'year': now.year if m <= current_month else now.year - 1,
                    'orders': 0,
                    'revenue': '0',
                })

        # ── Order Fulfillment Status (pie) ──
        fulfillment_status = list(
            Order.objects.values('status')
            .annotate(value=Count('id'))
            .order_by('status')
        )

        # ── Monthly Targets ──
        # Set a base target (e.g., previous month orders * 1.1 or minimum 10)
        prev_month_orders = Order.objects.filter(
            created_at__gte=prev_thirty_days, created_at__lt=thirty_days_ago
        ).count()
        order_target = max(int(prev_month_orders * 1.1), 10)
        revenue_target = max(float(prev_month_revenue) * 1.1, 1000) if prev_month_revenue else 1000

        monthly_targets = {
            'order_target': order_target,
            'orders_achieved': orders_this_month,
            'order_progress': min(round((orders_this_month / order_target * 100), 1), 100) if order_target > 0 else 0,
            'revenue_target': str(round(Decimal(str(revenue_target)), 2)),
            'revenue_achieved': str(current_month_revenue),
            'revenue_progress': min(round((float(current_month_revenue) / float(revenue_target) * 100), 1), 100) if revenue_target > 0 else 0,
        }

        # ── Most Selling Products (top 5) ──
        most_selling = list(
            OrderItem.objects.filter(order__is_paid=True)
            .values('product__id', 'product__name', 'product__sku',
                    'product__base_price', 'product__primary_image')
            .annotate(
                total_qty=Sum('quantity'),
                total_revenue=Sum('total_price')
            )
            .order_by('-total_qty')[:5]
        )
        for item in most_selling:
            item['total_revenue'] = str(item['total_revenue'])
            item['product__base_price'] = str(item['product__base_price'] or '0')

        # If no order-based data, fall back to active products
        if not most_selling:
            fallback_products = list(
                Product.objects.filter(is_active=True)
                .order_by('-order_count')[:5]
                .values('id', 'name', 'sku', 'base_price', 'primary_image', 'order_count')
            )
            most_selling = [{
                'product__id': p['id'],
                'product__name': p['name'],
                'product__sku': p['sku'],
                'product__base_price': str(p['base_price']),
                'product__primary_image': p['primary_image'],
                'total_qty': p['order_count'],
                'total_revenue': '0',
            } for p in fallback_products]

        # ── Least Selling Products (bottom 5) ──
        least_selling = list(
            OrderItem.objects.filter(order__is_paid=True)
            .values('product__id', 'product__name', 'product__sku',
                    'product__base_price', 'product__primary_image')
            .annotate(
                total_qty=Sum('quantity'),
                total_revenue=Sum('total_price')
            )
            .order_by('total_qty')[:5]
        )
        for item in least_selling:
            item['total_revenue'] = str(item['total_revenue'])
            item['product__base_price'] = str(item['product__base_price'] or '0')

        # ── Recent Orders Table (last 20) ──
        recent_orders = list(
            Order.objects.select_related('user', 'shipping_address')
            .order_by('-created_at')[:20]
            .values(
                'id', 'status', 'total_amount', 'is_paid', 'payment_method',
                'created_at', 'user__username', 'user__email',
            )
        )
        for order in recent_orders:
            order['total_amount'] = str(order['total_amount'])
            order['created_at'] = str(order['created_at'])
            # Get item count for this order
            order['item_count'] = OrderItem.objects.filter(order_id=order['id']).aggregate(
                total=Coalesce(Sum('quantity'), 0)
            )['total']

        # ── Order Status Distribution (for bar chart) ──
        status_distribution = list(
            Order.objects.values('status')
            .annotate(value=Count('id'))
            .order_by('status')
        )

        # ── Top Categories by Revenue ──
        top_categories = list(
            OrderItem.objects.filter(order__is_paid=True)
            .values(category=F('product__subcategory__category__name'))
            .annotate(
                total_orders=Sum('quantity'),
                total_revenue=Sum('total_price')
            )
            .order_by('-total_revenue')[:5]
        )
        for item in top_categories:
            item['total_revenue'] = str(item['total_revenue'])

        # If no order data, fall back to category product counts
        if not top_categories:
            top_categories = [
                {'category': cat['name'] or 'Uncategorized', 'total_orders': 0, 'total_revenue': '0'}
                for cat in category_distribution[:5]
            ]

        # ── Payment Method Distribution ──
        payment_methods = list(
            Order.objects.exclude(payment_method='')
            .values('payment_method')
            .annotate(count=Count('id'))
            .order_by('-count')[:5]
        )

        return Response({
            # Stat cards
            'total_orders': total_orders,
            'total_revenue': str(total_revenue),
            'avg_order_value': str(round(avg_order_value, 2)),
            'pending_orders': pending_orders,
            'delivered_orders': delivered_orders,
            'cancellation_rate': cancellation_rate,
            'total_customers': total_customers,
            'orders_this_month': orders_this_month,
            'revenue_growth': revenue_growth,

            # Chart insights
            'orders_by_date': orders_by_date,
            'category_distribution': category_distribution,
            'new_vs_repeated': {
                'new': new_customers,
                'repeated': repeated_customers,
            },
            'status_distribution': status_distribution,

            # Monthly sales trend
            'monthly_sales_trend': monthly_sales_trend,

            # Order fulfillment
            'fulfillment_status': fulfillment_status,

            # Monthly targets
            'monthly_targets': monthly_targets,

            # Products
            'most_selling': most_selling,
            'least_selling': least_selling,

            # Recent orders
            'recent_orders': recent_orders,

            # Insights
            'top_categories': top_categories,
            'payment_methods': payment_methods,
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


class CourierDashboardView(APIView):
    """Operational courier dashboard — shipment metrics, tracking, and management."""
    permission_classes = [permissions.IsAuthenticated, IsAdminOrStaff]

    def get(self, request):
        """Return courier dashboard metrics and shipment list."""
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)

        # All shipments
        shipments = Shipment.objects.all().select_related('order')
        recent_shipments = shipments.filter(created_at__gte=thirty_days_ago)

        total_shipments = shipments.count()
        in_transit = shipments.filter(status__in=['shipped', 'in_transit']).count()
        delivered = shipments.filter(status='delivered').count()
        processing = shipments.filter(status__in=['created', 'processing', 'pickup_scheduled']).count()

        # Dispatch SLA: % shipped within 48h of order creation
        on_time = 0
        total_checked = 0
        for s in recent_shipments:
            if s.order and s.shipped_at:
                total_checked += 1
                diff = (s.shipped_at - s.order.created_at).total_seconds() / 3600
                if diff <= 48:
                    on_time += 1
        sla_pct = round((on_time / max(total_checked, 1)) * 100)

        # Average delivery time
        delivered_shipments = shipments.filter(
            status='delivered', shipped_at__isnull=False, delivered_at__isnull=False
        )
        avg_delivery_days = 0
        if delivered_shipments.exists():
            total_days = sum(
                (s.delivered_at - s.shipped_at).days
                for s in delivered_shipments if s.delivered_at and s.shipped_at
            )
            avg_delivery_days = round(total_days / max(delivered_shipments.count(), 1), 1)

        # Shipment list
        shipment_list = []
        for s in shipments.order_by('-created_at')[:50]:
            shipment_list.append({
                'id': s.id,
                'order_id': s.order_id,
                'order_display': f'ORD{str(s.order_id).zfill(5)}',
                'tracking_number': s.tracking_number or '',
                'awb_code': s.awb_code or '',
                'carrier': s.carrier or 'ShipMozo',
                'status': s.status,
                'shipped_at': str(s.shipped_at) if s.shipped_at else None,
                'delivered_at': str(s.delivered_at) if s.delivered_at else None,
                'estimated_delivery': str(s.estimated_delivery) if s.estimated_delivery else None,
                'created_at': str(s.created_at) if s.created_at else None,
                'product_name': '',  # Would need OrderItem lookup
                'shiprocket_order_id': s.shiprocket_order_id or '',
            })

        return Response({
            'metrics': {
                'total_shipments': total_shipments,
                'in_transit': in_transit,
                'delivered': delivered,
                'processing': processing,
                'dispatch_sla': sla_pct,
                'avg_delivery_days': avg_delivery_days,
            },
            'shipments': shipment_list,
        })


class ShipmentTrackAdminView(APIView):
    """Track a single shipment via ShipMozo AWB."""
    permission_classes = [permissions.IsAuthenticated, IsAdminOrStaff]

    def get(self, request, shipment_id):
        try:
            shipment = Shipment.objects.get(id=shipment_id)
        except Shipment.DoesNotExist:
            return Response({'error': 'Shipment not found'}, status=404)

        tracking_data = {}
        if shipment.awb_code:
            try:
                from . import shipmozo_service
                result = shipmozo_service.track_order(shipment.awb_code)
                if result.get('success'):
                    tracking_data = result
            except Exception as e:
                tracking_data = {'error': str(e)}

        return Response({
            'shipment': ShipmentSerializer(shipment).data,
            'tracking': tracking_data,
        })

