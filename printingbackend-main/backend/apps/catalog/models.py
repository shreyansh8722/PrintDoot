from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, help_text="URL-friendly version of the name")
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'categories'
        ordering = ['display_order', 'name']

    def __str__(self):
        return self.name

class Subcategory(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='subcategories')
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, help_text="URL-friendly version of the name")
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='subcategories/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Product(models.Model):
    subcategory = models.ForeignKey(Subcategory, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    sku = models.CharField(max_length=50, unique=True, help_text="Stock Keeping Unit")
    description = models.TextField(blank=True)
    
    # Pricing
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Discounts
    DISCOUNT_TYPE_CHOICES = (
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed Amount'),
    )
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES, blank=True, null=True)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Percentage or fixed amount")
    discount_start_date = models.DateTimeField(null=True, blank=True)
    discount_end_date = models.DateTimeField(null=True, blank=True)
    is_on_sale = models.BooleanField(default=False)
    
    # Media (S3 URLs)
    primary_image = models.URLField(max_length=500, blank=True, null=True, help_text="S3 URL for primary image")
    
    # Inventory & Logistics
    stock_quantity = models.IntegerField(default=0, help_text="Available stock")
    is_infinite_stock = models.BooleanField(default=True, help_text="For POD items")
    
    # SEO
    meta_title = models.CharField(max_length=255, blank=True)
    meta_description = models.TextField(blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def final_price(self):
        """Calculate final price after discount"""
        if not self.is_on_sale or not self.discount_value:
            return self.base_price
        
        from django.utils import timezone
        now = timezone.now()
        
        # Check if discount is active
        if self.discount_start_date and now < self.discount_start_date:
            return self.base_price
        if self.discount_end_date and now > self.discount_end_date:
            return self.base_price
        
        # Apply discount
        if self.discount_type == 'percentage':
            discount_amount = self.base_price * (self.discount_value / 100)
            return max(self.base_price - discount_amount, 0)
        else:  # fixed
            return max(self.base_price - self.discount_value, 0)

    def __str__(self):
        return self.name



class ProductImage(models.Model):
    """
    Multiple images for a product (gallery) - S3 URLs
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.URLField(max_length=500, help_text="S3 URL for product image")
    alt_text = models.CharField(max_length=200, blank=True)
    display_order = models.IntegerField(default=0)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['display_order', 'created_at']

    def __str__(self):
        return f"{self.product.name} - Image {self.display_order}"

class ProductReview(models.Model):
    """
    Customer reviews for products
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='product_reviews')
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)], help_text="1-5 stars")
    title = models.CharField(max_length=200, blank=True)
    comment = models.TextField()
    is_verified_purchase = models.BooleanField(default=False)
    helpful_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('product', 'user')  # One review per user per product

    def __str__(self):
        return f"{self.user.email} - {self.product.name} ({self.rating}★)"

class Banner(models.Model):
    """
    Hero banners and promotional sections for homepage
    """
    PLACEMENT_CHOICES = (
        ('hero_primary', 'Hero Primary Section'),
        ('hero_secondary', 'Hero Secondary Section'),
        ('homepage', 'Homepage General'),
        ('category', 'Category Page'),
    )
    
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=200, blank=True)
    image = models.URLField(max_length=500, help_text="S3 URL for banner image")
    placement = models.CharField(max_length=20, choices=PLACEMENT_CHOICES, default='homepage')
    
    # Buttons stored as JSON: [{"label": "Shop Now", "link": "/products", "primary": true}]
    buttons_json = models.JSONField(default=list, blank=True, help_text="JSON array of button objects")
    footer_text = models.CharField(max_length=300, blank=True, help_text="Optional footer text with breadcrumb")
    
    # Display settings
    is_active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['placement', 'display_order', '-created_at']
    
    def __str__(self):
        return f"{self.get_placement_display()} - {self.title}"

