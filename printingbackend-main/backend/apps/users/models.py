from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

class Role(models.Model):
    """
    Defines varying levels of access (Customer, Print Shop Manager, Admin, etc.)
    Future-proofing: Can link to Django's Permission model for granular ACL.
    """
    name = models.CharField(max_length=50, unique=True, help_text="e.g. Customer, Printer, Designer")
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class User(AbstractUser):
    # Enterprise Identity
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    
    # B2B / Business Fields
    company_name = models.CharField(max_length=255, blank=True, help_text="For B2B clients")
    tax_id = models.CharField(max_length=50, blank=True, help_text="VAT/GST/Tax ID for invoices")
    
    # Status & Audit
    is_verified = models.BooleanField(default=False, help_text="Email/Phone verification status")
    marketing_opt_in = models.BooleanField(default=False)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    
    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')

    def __str__(self):
        return self.email if self.email else self.username

class Address(models.Model):
    TYPE_CHOICES = (
        ('billing', 'Billing'),
        ('shipping', 'Shipping'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    
    # Address Details
    company_name = models.CharField(max_length=255, blank=True, help_text="Company name for this specific location")
    recipient_name = models.CharField(max_length=255, help_text="Person to receive the package")
    phone_number = models.CharField(max_length=20, help_text="Contact number for delivery")
    
    street = models.CharField(max_length=255)
    apartment_suite = models.CharField(max_length=100, blank=True, help_text="Apt, Suite, Unit, etc.")
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100, blank=True, help_text="State/Province/Region")
    zip_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100)
    
    # Configurations
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    is_default = models.BooleanField(default=False, help_text="Is this the default address for this type?")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Prevent multiple defaults for the same type per user
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'type'], 
                condition=models.Q(is_default=True), 
                name='unique_default_address_per_type'
            )
        ]

    def save(self, *args, **kwargs):
        # If set to default, unset other defaults for this user/type
        if self.is_default:
            Address.objects.filter(user=self.user, type=self.type, is_default=True).update(is_default=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.recipient_name} - {self.city} ({self.type})"
