from rest_framework import serializers
from apps.catalog.models import Product


class ZakekeCatalogProductSerializer(serializers.ModelSerializer):
    """
    Serializer for Zakeke's Product Catalog API.
    Zakeke expects each product to have: modelCode, name, imageUrl
    """
    modelCode = serializers.SerializerMethodField()
    imageUrl = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['modelCode', 'name', 'imageUrl']

    def get_modelCode(self, obj):
        """
        Return a unique product code for Zakeke.
        Priority: Zakeke product ID > SKU > local ID.
        """
        # First priority: Use Zakeke product ID if product is linked
        try:
            if hasattr(obj, 'zakeke_mapping') and obj.zakeke_mapping:
                return obj.zakeke_mapping.zakeke_product_id
        except Exception:
            pass

        # Second priority: Use SKU
        if obj.sku:
            return str(obj.sku)

        # Fallback: Use local ID as string
        return str(obj.id)

    def get_imageUrl(self, obj):
        """Return product image URL."""
        # Try primary_image first
        if obj.primary_image:
            return str(obj.primary_image)

        # Try images relation
        try:
            first_image = obj.images.first()
            if first_image:
                if hasattr(first_image, 'image') and first_image.image:
                    return first_image.image.url
                if hasattr(first_image, 'url'):
                    return first_image.url
        except Exception:
            pass

        # Return a placeholder so Zakeke doesn't reject the product
        return None
