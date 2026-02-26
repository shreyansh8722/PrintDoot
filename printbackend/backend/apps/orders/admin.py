from django.contrib import admin
from .models import (
    Order, OrderItem, PrintJob, Shipment, ShipmentTrackingEvent,
    OrderStatusHistory, Invoice,
    ReturnRequest, Refund,
    RazorpayTransaction, PaymentLog,
    ShippingZone, ShippingRate, PincodeServiceability,
)

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

class OrderStatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    readonly_fields = ('old_status', 'new_status', 'changed_by', 'note', 'created_at')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'total_amount', 'is_paid', 'created_at')
    list_filter = ('status', 'is_paid', 'created_at')
    search_fields = ('id', 'user__email', 'transaction_id')
    inlines = [OrderItemInline, OrderStatusHistoryInline]

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product', 'quantity', 'unit_price', 'total_price')
    list_filter = ('order__status',)

@admin.register(PrintJob)
class PrintJobAdmin(admin.ModelAdmin):
    list_display = ('batch_id', 'status', 'printer_name', 'created_at')
    list_filter = ('status',)

@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ('order', 'carrier', 'courier_name', 'awb_code', 'tracking_number', 'status', 'shipped_at', 'delivered_at')
    list_filter = ('status', 'carrier', 'courier_name')
    search_fields = ('tracking_number', 'awb_code', 'shiprocket_order_id')
    readonly_fields = ('shipped_at',)


class ShipmentTrackingEventInline(admin.TabularInline):
    model = ShipmentTrackingEvent
    extra = 0
    readonly_fields = ('status', 'status_code', 'description', 'location', 'event_time', 'created_at')
    fields = readonly_fields
    can_delete = False


@admin.register(ShipmentTrackingEvent)
class ShipmentTrackingEventAdmin(admin.ModelAdmin):
    list_display = ('shipment', 'status', 'location', 'event_time', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('shipment__order__id', 'shipment__awb_code', 'status', 'location')
    readonly_fields = ('shipment', 'status', 'status_code', 'description', 'location', 'event_time', 'raw_data', 'created_at')

@admin.register(OrderStatusHistory)
class OrderStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ('order', 'old_status', 'new_status', 'changed_by', 'created_at')
    list_filter = ('new_status', 'created_at')
    readonly_fields = ('order', 'old_status', 'new_status', 'changed_by', 'note', 'created_at')

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'order', 'grand_total', 'issued_at')
    search_fields = ('invoice_number',)
    readonly_fields = ('invoice_number', 'order', 'subtotal', 'tax_total', 'shipping_total', 'discount_total', 'grand_total')

@admin.register(ReturnRequest)
class ReturnRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'user', 'reason', 'status', 'created_at')
    list_filter = ('status', 'reason', 'created_at')
    search_fields = ('order__id', 'user__email')
    readonly_fields = ('created_at', 'updated_at')

    def save_model(self, request, obj, form, change):
        """When admin approves a return, auto-create a refund."""
        old_obj = ReturnRequest.objects.filter(pk=obj.pk).first()
        super().save_model(request, obj, form, change)
        if old_obj and old_obj.status != 'Approved' and obj.status == 'Approved':
            from django.utils import timezone
            obj.approved_at = timezone.now()
            obj.save()
            # Auto-create refund
            Refund.objects.get_or_create(
                return_request=obj,
                defaults={
                    'order': obj.order,
                    'user': obj.user,
                    'amount': obj.order.total_amount,
                    'reason': f"Return approved: {obj.get_reason_display()}",
                    'status': 'Pending',
                }
            )
        elif old_obj and old_obj.status != 'Rejected' and obj.status == 'Rejected':
            from django.utils import timezone
            obj.rejected_at = timezone.now()
            obj.save()

@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'user', 'amount', 'status', 'refund_method', 'initiated_at')
    list_filter = ('status', 'refund_method', 'initiated_at')
    search_fields = ('order__id', 'user__email', 'transaction_id')

    def save_model(self, request, obj, form, change):
        """Track who processed the refund and update order status."""
        if change:
            old_obj = Refund.objects.filter(pk=obj.pk).first()
            if old_obj and old_obj.status != 'Completed' and obj.status == 'Completed':
                from django.utils import timezone
                obj.completed_at = timezone.now()
                obj.processed_by = request.user
                # Transition order to Refunded if possible
                order = obj.order
                if order.can_transition_to('Refunded'):
                    order.transition_status('Refunded', changed_by=request.user, note=f'Refund completed: ₹{obj.amount}')
                # Update return request status
                if obj.return_request:
                    obj.return_request.status = 'Completed'
                    obj.return_request.save()
        super().save_model(request, obj, form, change)


# =============================================================================
# MODULE 4: PAYMENT ADMIN
# =============================================================================

class PaymentLogInline(admin.TabularInline):
    model = PaymentLog
    extra = 0
    readonly_fields = (
        'event_type', 'razorpay_order_id', 'razorpay_payment_id',
        'is_success', 'error_message', 'ip_address', 'created_at',
    )
    fields = readonly_fields
    can_delete = False
    max_num = 0  # No adding from inline

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(RazorpayTransaction)
class RazorpayTransactionAdmin(admin.ModelAdmin):
    list_display = (
        'razorpay_order_id', 'order', 'user', 'amount_rupees_display',
        'status', 'method', 'created_at',
    )
    list_filter = ('status', 'method', 'currency', 'created_at')
    search_fields = ('razorpay_order_id', 'razorpay_payment_id', 'order__id', 'user__email')
    readonly_fields = (
        'order', 'user', 'razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature',
        'amount_paisa', 'currency', 'status', 'method', 'bank', 'wallet', 'vpa',
        'email', 'contact', 'error_code', 'error_description', 'error_reason',
        'amount_refunded_paisa', 'raw_response', 'created_at', 'updated_at',
    )
    inlines = [PaymentLogInline]

    def amount_rupees_display(self, obj):
        return f"₹{obj.amount_paisa / 100:.2f}"
    amount_rupees_display.short_description = 'Amount (₹)'


@admin.register(PaymentLog)
class PaymentLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'event_type', 'is_success', 'razorpay_order_id', 'created_at')
    list_filter = ('event_type', 'is_success', 'created_at')
    search_fields = ('razorpay_order_id', 'razorpay_payment_id', 'order__id')
    readonly_fields = (
        'order', 'razorpay_transaction', 'user', 'event_type',
        'razorpay_order_id', 'razorpay_payment_id',
        'request_payload', 'response_payload',
        'is_success', 'error_message', 'ip_address', 'user_agent', 'created_at',
    )

    def has_add_permission(self, request):
        return False  # Logs are immutable

    def has_change_permission(self, request, obj=None):
        return False


# =============================================================================
# MODULE 5: SHIPPING ADMIN
# =============================================================================

class ShippingRateInline(admin.TabularInline):
    model = ShippingRate
    extra = 1
    fields = (
        'method', 'min_weight_grams', 'max_weight_grams',
        'base_rate', 'per_kg_rate', 'base_weight_grams',
        'free_above', 'min_days', 'max_days', 'is_active',
    )


class PincodeInline(admin.TabularInline):
    model = PincodeServiceability
    extra = 1
    fields = (
        'pincode', 'city', 'state',
        'standard_available', 'express_available', 'priority_available',
        'cod_available', 'is_active',
    )


@admin.register(ShippingZone)
class ShippingZoneAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'is_active', 'rate_count', 'pincode_count')
    list_filter = ('is_active',)
    search_fields = ('name',)
    inlines = [ShippingRateInline, PincodeInline]

    def rate_count(self, obj):
        return obj.rates.count()
    rate_count.short_description = 'Rates'

    def pincode_count(self, obj):
        return obj.pincodes.count()
    pincode_count.short_description = 'Pincodes'


@admin.register(ShippingRate)
class ShippingRateAdmin(admin.ModelAdmin):
    list_display = (
        'zone', 'method', 'min_weight_grams', 'max_weight_grams',
        'base_rate', 'per_kg_rate', 'free_above', 'min_days', 'max_days', 'is_active',
    )
    list_filter = ('zone', 'method', 'is_active')
    search_fields = ('zone__name',)


@admin.register(PincodeServiceability)
class PincodeServiceabilityAdmin(admin.ModelAdmin):
    list_display = (
        'pincode', 'zone', 'city', 'state',
        'standard_available', 'express_available', 'priority_available',
        'cod_available', 'is_active',
    )
    list_filter = ('zone', 'standard_available', 'express_available', 'priority_available', 'cod_available', 'is_active')
    search_fields = ('pincode', 'city', 'state')
    list_editable = ('standard_available', 'express_available', 'priority_available', 'cod_available', 'is_active')
