from django.db import models
from django.utils.text import slugify


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
