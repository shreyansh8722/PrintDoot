from django.db import models
from django.conf import settings
from apps.catalog.models import Product
from apps.designs.models import SavedDesign
from apps.users.models import Address

class Order(models.Model):
    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Processing', 'Processing'),
        ('Hold', 'On Hold'),
        ('Printing', 'Printing'),
        ('Shipped', 'Shipped'),
        ('Delivered', 'Delivered'),
        ('Cancelled', 'Cancelled'),
        ('Refunded', 'Refunded'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    
    # Financials
    currency = models.CharField(max_length=3, default='USD')
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    tax_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    shipping_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    discount_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Payment Info
    payment_method = models.CharField(max_length=50, blank=True)
    transaction_id = models.CharField(max_length=100, blank=True)
    is_paid = models.BooleanField(default=False)
    paid_at = models.DateTimeField(null=True, blank=True)
    
    # Logistics
    shipping_address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    billing_address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True, related_name='billing_orders')
    estimated_delivery_date = models.DateField(null=True, blank=True)
    
    # Notes
    customer_notes = models.TextField(blank=True)
    internal_notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.id} - {self.status}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    design = models.ForeignKey(SavedDesign, on_delete=models.SET_NULL, null=True, blank=True)
    
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2) # Price at purchase time
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Enterprise Snapshots (CRITICAL for POD)
    product_name_snapshot = models.CharField(max_length=255, blank=True)
    sku_snapshot = models.CharField(max_length=50, blank=True)
    frozen_canvas_state = models.JSONField(null=True, blank=True) # The source of truth for printing
    
    # Production Output
    print_file_url = models.FileField(upload_to='print_files/', null=True, blank=True)
    render_status = models.CharField(max_length=20, default='pending') # pending, processing, completed, failed

    def save(self, *args, **kwargs):
        if not self.total_price:
            self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity}x {self.product_name_snapshot} (Order #{self.order.id})"

class PrintJob(models.Model):
    """
    Aggregates multiple OrderItems into a batch for physical printing
    """
    STATUS_CHOICES = (
        ('Queued', 'Queued'),
        ('Ripping', 'Ripping'),
        ('Printing', 'Printing'),
        ('Cutting', 'Cutting'),
        ('Completed', 'Completed'),
        ('Failed', 'Failed'),
    )
    
    batch_id = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Queued')
    items = models.ManyToManyField(OrderItem, related_name='print_jobs')
    
    printer_name = models.CharField(max_length=100, blank=True, help_text="Machine/Vendor ID")
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    error_log = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Job {self.batch_id} - {self.status}"

class Shipment(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='shipment')
    carrier = models.CharField(max_length=50) # UPS, FedEx, etc.
    tracking_number = models.CharField(max_length=100)
    label_url = models.URLField(blank=True)
    
    status = models.CharField(max_length=50, default='Label Created')
    weight_kg = models.DecimalField(max_digits=6, decimal_places=3, default=0.0)
    shipped_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Shipment for Order #{self.order.id}"
