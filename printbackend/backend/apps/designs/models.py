from django.db import models
from django.conf import settings
from apps.catalog.models import Product

class Font(models.Model):
    name = models.CharField(max_length=100)
    family = models.CharField(max_length=100)
    file = models.FileField(upload_to='fonts/')
    
    # Metadata
    weight = models.CharField(max_length=50, default='400', help_text="e.g. 400, 700, bold")
    style = models.CharField(max_length=50, default='normal', help_text="italic, normal")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.weight})"

class Asset(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='assets')
    file = models.FileField(upload_to='assets/')
    type = models.CharField(max_length=50) # image, logo, vector
    
    # Metadata
    original_filename = models.CharField(max_length=255, blank=True)
    size_bytes = models.BigIntegerField(null=True, blank=True)
    width = models.IntegerField(null=True, blank=True)
    height = models.IntegerField(null=True, blank=True)
    mime_type = models.CharField(max_length=100, blank=True)
    
    resolution_dpi = models.IntegerField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_archived = models.BooleanField(default=False)

    def __str__(self):
        return f"Asset {self.original_filename} ({self.user.username})"

class SavedDesign(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='designs')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='designs')
    
    # Core Data
    name = models.CharField(max_length=255, default="Untitled Design")
    design_json = models.JSONField(help_text="Fabric.js or similar canvas state")
    preview_image = models.ImageField(upload_to='previews/', null=True, blank=True)
    thumbnail_high_res = models.ImageField(upload_to='previews/hq/', null=True, blank=True)
    
    # Organization
    version = models.IntegerField(default=1)
    is_template = models.BooleanField(default=False)
    tags = models.JSONField(default=list, blank=True, help_text="List of tags")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} v{self.version} by {self.user.username}"

class Template(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='templates')
    # Link to specific print area (e.g. front or back)
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    surface = models.CharField(max_length=50, default='front')
    
    # The full design state (for legacy or complex templates)
    design_json = models.JSONField(null=True, blank=True)
    
    # categorization
    from apps.catalog.models import Subcategory
    subcategory = models.ForeignKey(Subcategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='templates')
    tags = models.JSONField(default=list, blank=True)
    
    preview_image = models.ImageField(upload_to='templates/', null=True, blank=True)
    locked = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class TemplateElement(models.Model):
    ELEMENT_TYPE_CHOICES = (
        ('text', 'Text'),
        ('image', 'Image'),
    )
    template = models.ForeignKey(Template, on_delete=models.CASCADE, related_name='elements')
    type = models.CharField(max_length=20, choices=ELEMENT_TYPE_CHOICES, default='text')
    
    # For text elements
    default_text = models.CharField(max_length=255, blank=True)
    
    # For image elements
    default_image = models.ImageField(upload_to='template_assets/', null=True, blank=True)
    
    # Positioning (Percentage based)
    x_percent = models.FloatField(default=50.0)
    y_percent = models.FloatField(default=50.0)
    max_width_percent = models.FloatField(default=80.0)
    rotation = models.FloatField(default=0.0)
    
    # Metadata
    font_family = models.CharField(max_length=100, blank=True)
    font_size = models.IntegerField(null=True, blank=True)
    color = models.CharField(max_length=20, blank=True) # hex
    
    locked = models.BooleanField(default=False)
    display_order = models.IntegerField(default=0)

    class Meta:
        ordering = ['display_order']

    def __str__(self):
        return f"{self.template.name} - {self.type} ({self.id})"
