from django.contrib import admin
from .models import Order, OrderItem, PrintJob, Shipment

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'total_amount', 'is_paid', 'created_at')
    list_filter = ('status', 'is_paid', 'created_at')
    search_fields = ('id', 'user__email', 'transaction_id')
    inlines = [OrderItemInline]

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
    list_display = ('order', 'carrier', 'tracking_number', 'status', 'shipped_at')
    list_filter = ('status', 'carrier')
