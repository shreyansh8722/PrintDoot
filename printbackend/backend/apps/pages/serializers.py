from rest_framework import serializers
from .models import LegalPage


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
