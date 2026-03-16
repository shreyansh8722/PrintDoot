from rest_framework import serializers
from .models import LegalPage, Offer, Banner


class OfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offer
        fields = ['id', 'text', 'icon', 'link', 'is_active', 'display_order', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


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
