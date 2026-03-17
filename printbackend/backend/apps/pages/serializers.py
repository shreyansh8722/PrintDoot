from rest_framework import serializers
from .models import LegalPage, Offer, Banner, PromoCode


class OfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offer
        fields = ['id', 'text', 'icon', 'link', 'is_active', 'display_order', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class PromoCodeSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()

    class Meta:
        model = PromoCode
        fields = [
            'id', 'code', 'description', 'discount_type', 'discount_value',
            'min_order_amount', 'max_discount', 'usage_limit', 'times_used',
            'valid_from', 'valid_to', 'is_active', 'status',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['times_used', 'created_at', 'updated_at']

    def get_status(self, obj):
        if not obj.is_active:
            return 'Inactive'
        if obj.is_expired:
            return 'Expired'
        if not obj.is_started:
            return 'Scheduled'
        if obj.is_usage_exceeded:
            return 'Limit Reached'
        return 'Active'

    def validate_code(self, value):
        return value.upper().strip()


class PromoCodeValidateSerializer(serializers.Serializer):
    """Public endpoint input: validate a promo code and return discount info."""
    code = serializers.CharField(max_length=30)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2)


class BannerSerializer(serializers.ModelSerializer):
    position_display = serializers.CharField(source='get_position_display', read_only=True)

    class Meta:
        model = Banner
        fields = [
            'id', 'title', 'subtitle', 'image_url', 'mobile_image_url',
            'link', 'position', 'position_display', 'is_active',
            'display_order', 'start_date', 'end_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class LegalPageListSerializer(serializers.ModelSerializer):
    """Brief serializer for listing pages."""
    page_type_display = serializers.CharField(source='get_page_type_display', read_only=True)

    class Meta:
        model = LegalPage
        fields = ['id', 'title', 'slug', 'page_type', 'page_type_display', 'meta_description', 'updated_at']


class LegalPageDetailSerializer(serializers.ModelSerializer):
    """Full serializer with content."""
    page_type_display = serializers.CharField(source='get_page_type_display', read_only=True)

    class Meta:
        model = LegalPage
        fields = ['id', 'title', 'slug', 'page_type', 'page_type_display', 'content', 'meta_description', 'updated_at']
