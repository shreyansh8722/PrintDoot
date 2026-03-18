from django.db import models
from django.utils.text import slugify
from django.utils import timezone


class Offer(models.Model):
    """
    Admin-manageable promotional offers shown in the homepage marquee.
    """
    text = models.CharField(max_length=200, help_text="Offer text displayed in the marquee (e.g. 'Flat 20% off on T-shirts')")
    icon = models.CharField(max_length=10, default="🔥", help_text="Emoji icon shown before the offer text")
    link = models.CharField(max_length=500, blank=True, default="", help_text="Optional link when user clicks the offer")
    is_active = models.BooleanField(default=True, help_text="Uncheck to hide this offer")
    display_order = models.IntegerField(default=0, help_text="Lower numbers appear first")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', '-created_at']
        verbose_name = 'Offer'
        verbose_name_plural = 'Offers'

    def __str__(self):
        return self.text[:60]


class PromoCode(models.Model):
    """
    Real promo / discount codes that users can apply at checkout.
    """
    DISCOUNT_TYPE_CHOICES = [
        ('percentage', 'Percentage Discount'),
        ('flat', 'Flat Amount Discount'),
    ]

    code = models.CharField(max_length=30, unique=True, help_text="Promo code (e.g. WELCOME20)")
    description = models.CharField(max_length=200, blank=True, default="", help_text="Human-readable description")
    discount_type = models.CharField(max_length=12, choices=DISCOUNT_TYPE_CHOICES, default='percentage')
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, help_text="Discount value (percentage 0-100 or flat amount in ₹)")
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Minimum order subtotal to use this code")
    max_discount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Max discount cap for percentage codes (₹)")
    usage_limit = models.PositiveIntegerField(default=0, help_text="Max total uses (0 = unlimited)")
    times_used = models.PositiveIntegerField(default=0, help_text="How many times this code has been used")
    valid_from = models.DateTimeField(null=True, blank=True, help_text="Code becomes active after this datetime")
    valid_to = models.DateTimeField(null=True, blank=True, help_text="Code expires after this datetime")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Promo Code'
        verbose_name_plural = 'Promo Codes'

    def __str__(self):
        return f"{self.code} ({self.get_discount_type_display()} — {self.discount_value})"

    @property
    def is_expired(self):
        now = timezone.now()
        if self.valid_to and now > self.valid_to:
            return True
        return False

    @property
    def is_started(self):
        now = timezone.now()
        if self.valid_from and now < self.valid_from:
            return False
        return True

    @property
    def is_usage_exceeded(self):
        if self.usage_limit > 0 and self.times_used >= self.usage_limit:
            return True
        return False

    def is_valid(self):
        """Check if the promo code can be used right now."""
        return self.is_active and self.is_started and not self.is_expired and not self.is_usage_exceeded

    def apply_discount(self, subtotal):
        """
        Calculate the discount amount for a given subtotal.
        Returns Decimal discount amount (capped if applicable).
        """
        from decimal import Decimal, ROUND_HALF_UP

        subtotal = Decimal(str(subtotal))
        if subtotal < self.min_order_amount:
            return Decimal('0.00')

        if self.discount_type == 'percentage':
            discount = (subtotal * self.discount_value / Decimal('100')).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            if self.max_discount and discount > self.max_discount:
                discount = self.max_discount
        else:
            discount = min(self.discount_value, subtotal)

        return discount


class Banner(models.Model):
    """
    Admin-manageable banners / hero images for the website.
    Supports multiple positions (hero, sidebar, promotional strip, etc.)
    """
    POSITION_CHOICES = [
        ('hero', 'Hero Banner (Homepage)'),
        ('promo', 'Promotional Banner'),
        ('sidebar', 'Sidebar Banner'),
        ('category', 'Category Page Banner'),
        ('popup', 'Popup Banner'),
    ]

    title = models.CharField(max_length=200, help_text="Banner title (internal reference)")
    subtitle = models.CharField(max_length=300, blank=True, default="", help_text="Optional subtitle or tagline")
    image_url = models.URLField(max_length=1000, help_text="Full URL to the banner image (e.g. S3 or CDN link)")
    mobile_image_url = models.URLField(max_length=1000, blank=True, default="", help_text="Optional mobile-specific image URL")
    link = models.CharField(max_length=500, blank=True, default="", help_text="URL to navigate when banner is clicked")
    position = models.CharField(max_length=20, choices=POSITION_CHOICES, default='hero', help_text="Where the banner appears on the site")
    is_active = models.BooleanField(default=True, help_text="Uncheck to hide this banner")
    display_order = models.IntegerField(default=0, help_text="Lower numbers appear first in that position")
    start_date = models.DateTimeField(null=True, blank=True, help_text="Optional: banner becomes visible after this date")
    end_date = models.DateTimeField(null=True, blank=True, help_text="Optional: banner is hidden after this date")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['position', 'display_order', '-created_at']
        verbose_name = 'Banner'
        verbose_name_plural = 'Banners'

    def __str__(self):
        return f"{self.title} ({self.get_position_display()})"


class LegalPage(models.Model):
    """
    Admin-manageable legal/info pages (Privacy Policy, Terms & Conditions, etc.)
    Content is stored as HTML so the admin can use rich text.
    """
    PAGE_TYPE_CHOICES = [
        ('privacy', 'Privacy Policy'),
        ('terms', 'Terms & Conditions'),
        ('cookies', 'Cookie Policy'),
        ('refund', 'Refund Policy'),
        ('shipping', 'Shipping Policy'),
        ('about', 'About Us'),
        ('contact', 'Contact Us'),
        ('faq', 'FAQ'),
        ('custom', 'Custom Page'),
    ]

    title = models.CharField(max_length=200, help_text="Page title displayed at the top")
    slug = models.SlugField(max_length=200, unique=True, help_text="URL-friendly identifier (auto-generated from title)")
    page_type = models.CharField(max_length=20, choices=PAGE_TYPE_CHOICES, default='custom', help_text="Type of page")
    content = models.TextField(help_text="Page content (HTML supported)")
    meta_description = models.CharField(max_length=300, blank=True, help_text="SEO meta description")
    is_published = models.BooleanField(default=True, help_text="Uncheck to hide this page")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['title']
        verbose_name = 'Legal Page'
        verbose_name_plural = 'Legal Pages'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.get_page_type_display()})"


class OfflinePayment(models.Model):
    """
    Offline store payments recorded by admin for tracking purposes.
    """
    STATUS_CHOICES = [
        ('received', 'Received'),
        ('pending', 'Pending'),
    ]

    METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('upi', 'UPI'),
        ('bank_transfer', 'Bank Transfer'),
        ('credit_card', 'Credit Card'),
        ('debit_card', 'Debit Card'),
        ('cheque', 'Cheque'),
        ('other', 'Other'),
    ]

    customer_name = models.CharField(max_length=200, help_text="Customer name")
    amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="Payment amount (₹)")
    payment_method = models.CharField(max_length=20, choices=METHOD_CHOICES, default='cash')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='received')
    note = models.CharField(max_length=500, blank=True, default="", help_text="Invoice number, description, etc.")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Offline Payment'
        verbose_name_plural = 'Offline Payments'

    def __str__(self):
        return f"{self.customer_name} — ₹{self.amount} ({self.get_status_display()})"
