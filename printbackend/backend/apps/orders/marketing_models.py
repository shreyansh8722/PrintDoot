"""
Marketing Campaigns App - Models for automated marketing.

Provides:
- Campaign management (email + WhatsApp)
- Cart abandonment tracking & automated follow-ups
- Customer segmentation for targeted campaigns
- Campaign analytics (sent, opened, clicked)
"""
from django.db import models
from django.conf import settings


class Campaign(models.Model):
    """Marketing campaign (email or WhatsApp) created by admin."""
    CHANNEL_CHOICES = (
        ('email', 'Email'),
        ('whatsapp', 'WhatsApp'),
        ('both', 'Email + WhatsApp'),
    )
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('scheduled', 'Scheduled'),
        ('sending', 'Sending'),
        ('sent', 'Sent'),
        ('paused', 'Paused'),
        ('cancelled', 'Cancelled'),
    )
    TRIGGER_CHOICES = (
        ('manual', 'Manual Send'),
        ('cart_abandonment', 'Cart Abandonment'),
        ('order_followup', 'Order Follow-up'),
        ('welcome', 'Welcome New User'),
        ('inactive_user', 'Re-engage Inactive User'),
        ('product_restock', 'Product Back in Stock'),
    )

    name = models.CharField(max_length=255, help_text="Internal campaign name")
    channel = models.CharField(max_length=10, choices=CHANNEL_CHOICES, default='email')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    trigger_type = models.CharField(max_length=30, choices=TRIGGER_CHOICES, default='manual')

    # Content
    subject = models.CharField(max_length=255, blank=True, help_text="Email subject line")
    email_body = models.TextField(blank=True, help_text="HTML email body")
    whatsapp_message = models.TextField(blank=True, help_text="WhatsApp message template")

    # Targeting
    target_all_users = models.BooleanField(default=False)
    target_users = models.ManyToManyField(
        settings.AUTH_USER_MODEL, blank=True, related_name='targeted_campaigns'
    )

    # Scheduling
    scheduled_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    # Analytics
    total_recipients = models.IntegerField(default=0)
    emails_sent = models.IntegerField(default=0)
    emails_opened = models.IntegerField(default=0)
    emails_clicked = models.IntegerField(default=0)
    whatsapp_sent = models.IntegerField(default=0)
    whatsapp_delivered = models.IntegerField(default=0)
    whatsapp_read = models.IntegerField(default=0)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='created_campaigns'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.get_channel_display()}) - {self.get_status_display()}"


class CampaignLog(models.Model):
    """Individual send log for each recipient in a campaign."""
    DELIVERY_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('opened', 'Opened'),
        ('clicked', 'Clicked'),
        ('bounced', 'Bounced'),
        ('failed', 'Failed'),
    )

    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='logs')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='campaign_logs'
    )
    channel = models.CharField(max_length=10, choices=Campaign.CHANNEL_CHOICES)
    status = models.CharField(max_length=20, choices=DELIVERY_STATUS_CHOICES, default='pending')

    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    opened_at = models.DateTimeField(null=True, blank=True)
    clicked_at = models.DateTimeField(null=True, blank=True)

    error_message = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.campaign.name} → {self.user.email} ({self.status})"


class AbandonedCart(models.Model):
    """
    Tracks abandoned carts for automated follow-up.
    Created when a user adds items to cart but doesn't complete purchase within a threshold.
    """
    STATUS_CHOICES = (
        ('abandoned', 'Abandoned'),
        ('reminder_sent', 'Reminder Sent'),
        ('recovered', 'Recovered'),
        ('expired', 'Expired'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='abandoned_carts'
    )
    cart_data = models.JSONField(
        help_text="Snapshot of cart items: [{product_id, name, quantity, price, image}]"
    )
    cart_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='abandoned')

    # Follow-up tracking
    reminder_count = models.IntegerField(default=0, help_text="Number of reminders sent")
    last_reminder_at = models.DateTimeField(null=True, blank=True)
    email_sent = models.BooleanField(default=False)
    whatsapp_sent = models.BooleanField(default=False)

    # Recovery tracking
    recovered_order = models.ForeignKey(
        'orders.Order', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='recovered_from_cart'
    )
    recovered_at = models.DateTimeField(null=True, blank=True)

    abandoned_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-abandoned_at']

    def __str__(self):
        return f"Abandoned cart by {self.user.email} - ₹{self.cart_total} ({self.status})"


class MarketingSettings(models.Model):
    """
    Singleton model for global marketing configuration.
    """
    # Cart Abandonment Settings
    cart_abandonment_enabled = models.BooleanField(default=True)
    cart_abandonment_delay_minutes = models.IntegerField(
        default=60, help_text="Minutes after cart becomes idle to trigger reminder"
    )
    cart_abandonment_max_reminders = models.IntegerField(default=3)

    # WhatsApp Settings
    whatsapp_enabled = models.BooleanField(default=False)
    whatsapp_api_provider = models.CharField(
        max_length=50, blank=True,
        help_text="e.g., twilio, wati, interakt, gupshup"
    )

    # Email Settings
    email_campaigns_enabled = models.BooleanField(default=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Marketing Settings'
        verbose_name_plural = 'Marketing Settings'

    def save(self, *args, **kwargs):
        # Singleton pattern - only allow one instance
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return "Marketing Settings"
