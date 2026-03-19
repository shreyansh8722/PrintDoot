from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from apps.catalog.models import Product
from apps.designs.models import SavedDesign
from apps.users.models import Address
import uuid


def _get_private_storage():
    """Return PrivateMediaStorage if S3 is enabled, else default local storage."""
    if getattr(settings, 'USE_S3', False):
        from shop_project.storage_backends import PrivateMediaStorage
        return PrivateMediaStorage()
    return None  # Django uses default storage


class Order(models.Model):
    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Paid', 'Paid'),
        ('Processing', 'Processing'),
        ('Printing', 'Printing'),
        ('Shipped', 'Shipped'),
        ('Delivered', 'Delivered'),
        ('Cancelled', 'Cancelled'),
        ('Refunded', 'Refunded'),
    )

    # Valid status transitions: from_status -> [allowed_next_statuses]
    VALID_TRANSITIONS = {
        'Pending':    ['Paid', 'Cancelled'],
        'Paid':       ['Processing', 'Cancelled', 'Refunded'],
        'Processing': ['Printing', 'Cancelled', 'Refunded'],
        'Printing':   ['Shipped', 'Cancelled'],
        'Shipped':    ['Delivered'],
        'Delivered':  ['Refunded'],
        'Cancelled':  [],
        'Refunded':   [],
    }

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

    def can_transition_to(self, new_status):
        """Check if transition to new_status is allowed."""
        allowed = self.VALID_TRANSITIONS.get(self.status, [])
        return new_status in allowed

    def transition_status(self, new_status, changed_by=None, note=''):
        """
        Transition order to a new status with validation.
        Creates a history record for audit trail.
        """
        if not self.can_transition_to(new_status):
            raise ValidationError(
                f"Cannot transition from '{self.status}' to '{new_status}'. "
                f"Allowed transitions: {', '.join(self.VALID_TRANSITIONS.get(self.status, []))}"
            )
        old_status = self.status
        self.status = new_status

        # Auto-set paid_at when transitioning to Paid
        if new_status == 'Paid' and not self.paid_at:
            from django.utils import timezone
            self.paid_at = timezone.now()
            self.is_paid = True

            # Increment order_count on each product in this order (for trending)
            from apps.catalog.models import Product
            from django.db.models import F
            product_ids = list(self.items.values_list('product_id', flat=True))
            if product_ids:
                Product.objects.filter(id__in=product_ids).update(order_count=F('order_count') + 1)

        # ── Restore stock when order is cancelled or refunded ──
        if new_status in ('Cancelled', 'Refunded'):
            from apps.catalog.models import Product
            from django.db.models import F
            for item in self.items.select_related('product').all():
                if item.product and not item.product.is_infinite_stock:
                    Product.objects.filter(id=item.product_id).update(
                        stock_quantity=F('stock_quantity') + item.quantity
                    )

        self.save()

        # Create status history record
        OrderStatusHistory.objects.create(
            order=self,
            old_status=old_status,
            new_status=new_status,
            changed_by=changed_by,
            note=note,
        )
        return self


class OrderStatusHistory(models.Model):
    """Audit trail for every order status change."""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    old_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='order_status_changes'
    )
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Order status histories'

    def __str__(self):
        return f"Order #{self.order_id}: {self.old_status} → {self.new_status}"


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
    
    # Zakeke Design Pricing
    design_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00,
                                       help_text="Design/customization price from Zakeke")
    zakeke_design_id = models.CharField(max_length=255, blank=True,
                                        help_text="Zakeke design ID for this item")

    # Production Output
    print_file_url = models.FileField(upload_to='print_files/', storage=_get_private_storage(), null=True, blank=True)
    high_res_design_url = models.URLField(blank=True,
                                          help_text="High-resolution print file URL from Zakeke")
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
    items = models.ManyToManyField('OrderItem', related_name='print_jobs')
    
    printer_name = models.CharField(max_length=100, blank=True, help_text="Machine/Vendor ID")
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    error_log = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Job {self.batch_id} - {self.status}"

class Shipment(models.Model):
    STATUS_CHOICES = (
        ('label_created', 'Label Created'),
        ('pickup_scheduled', 'Pickup Scheduled'),
        ('picked_up', 'Picked Up'),
        ('in_transit', 'In Transit'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('rto_initiated', 'RTO Initiated'),
        ('rto_delivered', 'RTO Delivered'),
        ('cancelled', 'Cancelled'),
        ('lost', 'Lost'),
    )

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='shipment')
    carrier = models.CharField(max_length=50) # Delhivery, BlueDart, etc.
    tracking_number = models.CharField(max_length=100)
    label_url = models.URLField(blank=True)
    
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='label_created')
    weight_kg = models.DecimalField(max_digits=6, decimal_places=3, default=0.0)
    shipped_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    estimated_delivery = models.DateField(null=True, blank=True)

    # Shiprocket Integration Fields
    shiprocket_order_id = models.CharField(max_length=100, blank=True, db_index=True)
    shiprocket_shipment_id = models.CharField(max_length=100, blank=True, db_index=True)
    awb_code = models.CharField(max_length=100, blank=True, db_index=True,
                                help_text="Air Waybill number from courier")
    courier_name = models.CharField(max_length=100, blank=True,
                                    help_text="Courier partner name from Shiprocket")
    pickup_location = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"Shipment for Order #{self.order.id} ({self.get_status_display()})"


class ShipmentTrackingEvent(models.Model):
    """Individual tracking events for a shipment (scan history)."""
    shipment = models.ForeignKey(Shipment, on_delete=models.CASCADE, related_name='tracking_events')
    status = models.CharField(max_length=100, help_text="e.g. In Transit, Out for Delivery")
    status_code = models.CharField(max_length=50, blank=True, help_text="Shiprocket status code")
    description = models.TextField(blank=True, help_text="Detailed event description")
    location = models.CharField(max_length=255, blank=True, help_text="City/Hub where scan occurred")
    event_time = models.DateTimeField(help_text="When the event occurred at the courier")
    raw_data = models.JSONField(null=True, blank=True, help_text="Raw API response for this event")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-event_time']
        verbose_name_plural = 'Shipment tracking events'

    def __str__(self):
        return f"[{self.event_time:%Y-%m-%d %H:%M}] {self.status} — {self.location}"


class Invoice(models.Model):
    """Auto-generated invoice for an order once it moves to Paid."""
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='invoice')
    invoice_number = models.CharField(max_length=50, unique=True)
    pdf_file = models.FileField(upload_to='invoices/', storage=_get_private_storage(), null=True, blank=True)
    issued_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField(null=True, blank=True)

    # Snapshot of financials at invoice time
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    tax_total = models.DecimalField(max_digits=12, decimal_places=2)
    shipping_total = models.DecimalField(max_digits=12, decimal_places=2)
    discount_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2)

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = f"INV-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Invoice {self.invoice_number} for Order #{self.order_id}"


class ReturnRequest(models.Model):
    """Customer-initiated return request."""
    REASON_CHOICES = (
        ('defective', 'Defective / Damaged Product'),
        ('wrong_item', 'Wrong Item Received'),
        ('not_as_described', 'Not As Described'),
        ('quality', 'Quality Not Satisfactory'),
        ('changed_mind', 'Changed My Mind'),
        ('other', 'Other'),
    )
    STATUS_CHOICES = (
        ('Requested', 'Requested'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
        ('Items_Received', 'Items Received'),
        ('Refund_Initiated', 'Refund Initiated'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    )

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='return_requests')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='return_requests')
    reason = models.CharField(max_length=30, choices=REASON_CHOICES)
    description = models.TextField(blank=True, help_text="Detailed reason for return")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Requested')

    # Which items are being returned
    items = models.ManyToManyField('OrderItem', related_name='return_requests', blank=True)

    # Admin response
    admin_notes = models.TextField(blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Return #{self.id} for Order #{self.order_id} ({self.status})"


class Refund(models.Model):
    """Tracks refund processing linked to a return or order cancellation."""
    REFUND_STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Processing', 'Processing'),
        ('Completed', 'Completed'),
        ('Failed', 'Failed'),
    )
    REFUND_METHOD_CHOICES = (
        ('original', 'Original Payment Method'),
        ('store_credit', 'Store Credit'),
        ('bank_transfer', 'Bank Transfer'),
    )

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='refunds')
    return_request = models.OneToOneField(
        ReturnRequest, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='refund'
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='refunds')

    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=REFUND_STATUS_CHOICES, default='Pending')
    refund_method = models.CharField(max_length=20, choices=REFUND_METHOD_CHOICES, default='original')
    transaction_id = models.CharField(max_length=100, blank=True)

    initiated_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Admin
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='processed_refunds'
    )
    admin_notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-initiated_at']

    def __str__(self):
        return f"Refund ₹{self.amount} for Order #{self.order_id} ({self.status})"


# =============================================================================
# MODULE 4: PAYMENTS — Instamojo Integration & Transaction Logs
# =============================================================================

class InstamojoTransaction(models.Model):
    """
    Tracks an Instamojo payment lifecycle:
    1. Payment request created (instamojo_payment_request_id populated)
    2. User redirected to Instamojo for payment
    3. Payment completed -> payment_id stored
    4. Webhook confirms final status
    """
    STATUS_CHOICES = (
        ('created', 'Created'),        # Payment request created, awaiting payment
        ('captured', 'Captured'),      # Payment captured successfully
        ('failed', 'Failed'),          # Payment failed
        ('refunded', 'Refunded'),      # Payment refunded (partial or full)
    )

    order = models.OneToOneField(
        Order, on_delete=models.CASCADE, related_name='instamojo_transaction'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='instamojo_transactions'
    )

    # Instamojo identifiers
    instamojo_payment_request_id = models.CharField(max_length=100, unique=True, db_index=True)
    instamojo_payment_id = models.CharField(max_length=100, blank=True, db_index=True)

    # Amount in rupees
    amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="Amount in ₹")
    currency = models.CharField(max_length=3, default='INR')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='created')

    # Instamojo details
    purpose = models.CharField(max_length=255, blank=True)
    longurl = models.URLField(blank=True, help_text="Instamojo payment URL")
    method = models.CharField(max_length=30, blank=True, help_text="card, upi, netbanking, wallet, etc.")
    email = models.EmailField(blank=True)
    contact = models.CharField(max_length=20, blank=True)

    # Error tracking
    error_code = models.CharField(max_length=100, blank=True)
    error_description = models.TextField(blank=True)

    # Refund tracking
    amount_refunded = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Instamojo raw payload (for debugging)
    raw_response = models.JSONField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Instamojo {self.instamojo_payment_request_id} — ₹{self.amount} ({self.status})"


class PaymentLog(models.Model):
    """
    Immutable audit trail for every payment-related event.
    Stores success/failure logs, webhook events, retries, etc.
    """
    EVENT_TYPES = (
        ('order_created', 'Payment Request Created'),
        ('payment_initiated', 'Payment Initiated'),
        ('payment_success', 'Payment Success'),
        ('payment_failed', 'Payment Failed'),
        ('signature_verified', 'Payment Verified'),
        ('signature_failed', 'Payment Verification Failed'),
        ('webhook_received', 'Webhook Received'),
        ('webhook_payment_captured', 'Webhook: Payment Captured'),
        ('webhook_payment_failed', 'Webhook: Payment Failed'),
        ('refund_initiated', 'Refund Initiated'),
        ('refund_success', 'Refund Successful'),
        ('refund_failed', 'Refund Failed'),
    )

    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name='payment_logs', null=True, blank=True
    )
    instamojo_transaction = models.ForeignKey(
        InstamojoTransaction, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='logs'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='payment_logs'
    )

    event_type = models.CharField(max_length=30, choices=EVENT_TYPES, db_index=True)
    instamojo_payment_request_id = models.CharField(max_length=100, blank=True)
    instamojo_payment_id = models.CharField(max_length=100, blank=True)

    # Payload
    request_payload = models.JSONField(null=True, blank=True, help_text="Data sent to Instamojo")
    response_payload = models.JSONField(null=True, blank=True, help_text="Data received from Instamojo")

    # Result
    is_success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True)

    # Context
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Payment logs'

    def __str__(self):
        return f"[{self.event_type}] Order #{self.order_id} at {self.created_at:%Y-%m-%d %H:%M}"


# =============================================================================
# MODULE 5: SHIPPING — Zones, Rates & Serviceability
# =============================================================================

class ShippingZone(models.Model):
    """
    Geographic shipping zone.
    E.g., "Metro Cities", "Tier 1", "Tier 2", "Remote"
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class ShippingRate(models.Model):
    """
    Rate card for a zone + shipping method + weight slab.
    Supports both flat + per-kg pricing.
    """
    SHIPPING_METHOD_CHOICES = (
        ('standard', 'Standard Delivery'),
        ('express', 'Express Delivery'),
        ('priority', 'Priority Delivery'),
    )

    zone = models.ForeignKey(ShippingZone, on_delete=models.CASCADE, related_name='rates')
    method = models.CharField(max_length=20, choices=SHIPPING_METHOD_CHOICES)

    # Weight slab (inclusive bounds, in grams)
    min_weight_grams = models.PositiveIntegerField(default=0, help_text="Minimum weight in grams (inclusive)")
    max_weight_grams = models.PositiveIntegerField(default=99999, help_text="Maximum weight in grams (inclusive)")

    # Pricing
    base_rate = models.DecimalField(max_digits=10, decimal_places=2, help_text="Flat base charge in ₹")
    per_kg_rate = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text="Additional charge per kg above base weight"
    )
    base_weight_grams = models.PositiveIntegerField(
        default=500,
        help_text="Weight included in base_rate; per_kg_rate applies above this"
    )

    # Free shipping threshold
    free_above = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Order value above which shipping is free (₹). Leave blank = never free."
    )

    # ETA
    min_days = models.PositiveIntegerField(default=3)
    max_days = models.PositiveIntegerField(default=7)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['zone', 'method', 'min_weight_grams']
        unique_together = ('zone', 'method', 'min_weight_grams', 'max_weight_grams')

    def __str__(self):
        return (
            f"{self.zone.name} | {self.get_method_display()} | "
            f"{self.min_weight_grams}–{self.max_weight_grams}g → ₹{self.base_rate}"
        )


class PincodeServiceability(models.Model):
    """
    Maps a pincode to a ShippingZone and specifies which methods are available + COD flag.
    """
    pincode = models.CharField(max_length=10, db_index=True)
    zone = models.ForeignKey(ShippingZone, on_delete=models.CASCADE, related_name='pincodes')

    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)

    # Which methods are available at this pincode
    standard_available = models.BooleanField(default=True)
    express_available = models.BooleanField(default=True)
    priority_available = models.BooleanField(default=False)
    cod_available = models.BooleanField(default=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Pincode serviceability'
        ordering = ['pincode']

    def __str__(self):
        return f"{self.pincode} → {self.zone.name} ({self.city})"


# =============================================================================
# CART STOCK HOLD — Temporary stock reservation for checkout
# =============================================================================

class StockHold(models.Model):
    """
    Temporarily holds stock for a product while a customer is in the checkout flow.
    Holds expire after HOLD_DURATION_MINUTES (default 10 minutes).
    Expired holds are cleaned up by the `cleanup_stock_holds` management command.
    """
    HOLD_DURATION_MINUTES = 10

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_holds')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='stock_holds', null=True, blank=True,
    )
    session_key = models.CharField(max_length=100, blank=True, default='')
    quantity = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_released = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['product', 'is_released', 'expires_at']),
        ]

    def __str__(self):
        return f"Hold: {self.quantity}x {self.product.name} (expires {self.expires_at})"

    @property
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() >= self.expires_at

    @property
    def is_active(self):
        return not self.is_released and not self.is_expired

    def release(self):
        """Release this hold, making the stock available again."""
        self.is_released = True
        self.save(update_fields=['is_released'])

    def save(self, *args, **kwargs):
        if not self.expires_at:
            from django.utils import timezone
            from datetime import timedelta
            self.expires_at = timezone.now() + timedelta(minutes=self.HOLD_DURATION_MINUTES)
        super().save(*args, **kwargs)

    @classmethod
    def get_held_quantity(cls, product_id):
        """Total quantity currently held (active, non-expired) for a product."""
        from django.utils import timezone
        return cls.objects.filter(
            product_id=product_id,
            is_released=False,
            expires_at__gt=timezone.now(),
        ).aggregate(total=models.Sum('quantity'))['total'] or 0

    @classmethod
    def get_available_stock(cls, product):
        """Available stock = stock_quantity - active holds."""
        if product.is_infinite_stock:
            return 999999  # Infinite
        held = cls.get_held_quantity(product.id)
        return max(0, product.stock_quantity - held)

    @classmethod
    def cleanup_expired(cls):
        """Release all expired holds. Call from management command or cron."""
        from django.utils import timezone
        expired = cls.objects.filter(
            is_released=False,
            expires_at__lte=timezone.now(),
        )
        count = expired.update(is_released=True)
        return count
