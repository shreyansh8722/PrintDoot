from django.db import models
from django.utils.text import slugify


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
