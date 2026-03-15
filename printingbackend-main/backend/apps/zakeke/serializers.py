from rest_framework import serializers
from apps.catalog.models import Product

class ZakekeCatalogProductSerializer(serializers.ModelSerializer):
    """Serializer for Zakeke's Product Catalog API."""
    code = serializers.SerializerMethodField()  # Use SKU or Zakeke ID if available
    thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['code', 'name', 'thumbnail']

    def get_code(self, obj):
        """Return Zakeke product ID if linked, otherwise use SKU, fallback to ID."""
        # First priority: Use Zakeke product ID if product is linked
        try:
            if hasattr(obj, 'zakeke_mapping') and obj.zakeke_mapping:
                return obj.zakeke_mapping.zakeke_product_id
        except:
            pass
        
        # Second priority: Use SKU if available
        if obj.sku:
            return obj.sku
        
        # Fallback: Use local ID as string (for backward compatibility)
        return str(obj.id)

    def get_thumbnail(self, obj):
        return obj.primary_image if obj.primary_image else None
