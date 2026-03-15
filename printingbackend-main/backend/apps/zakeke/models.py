from django.db import models
from apps.catalog.models import Product

class ZakekeProduct(models.Model):
    """
    Mapping between local products and Zakeke products.
    """
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='zakeke_mapping')
    zakeke_product_id = models.CharField(max_length=255, help_text="ID of the product in Zakeke backoffice")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.product.name} -> Zakeke: {self.zakeke_product_id}"
