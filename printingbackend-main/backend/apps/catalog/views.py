from rest_framework import viewsets, permissions, filters
from django.db import models
from .models import Category, Subcategory, Product, Banner
from .serializers import CategorySerializer, SubcategorySerializer, ProductSerializer, BannerSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Categories (Top Level).
    """
    queryset = Category.objects.filter(is_active=True).order_by('display_order')
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class SubcategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Subcategories.
    """
    queryset = Subcategory.objects.filter(is_active=True).order_by('display_order')
    serializer_class = SubcategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'category__name']

    def get_queryset(self):
        queryset = super().get_queryset()
        # If accessed via nested route, filter by category
        category_pk = self.kwargs.get('category_pk')
        if category_pk:
            queryset = queryset.filter(category_id=category_pk)
        return queryset

class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Products.
    """
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'sku', 'description']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # If accessed via nested route /subcategories/{id}/products/
        subcategory_pk = self.kwargs.get('subcategory_pk')
        if subcategory_pk:
            queryset = queryset.filter(subcategory_id=subcategory_pk)
            return queryset
        
        # Filter by Subcategory Slug (query param)
        subcategory_slug = self.request.query_params.get('subcategory', None)
        if subcategory_slug:
            queryset = queryset.filter(subcategory__slug=subcategory_slug)
            
        # Filter by Parent Category Slug (query param)
        category_slug = self.request.query_params.get('category', None)
        if category_slug:
            queryset = queryset.filter(subcategory__category__slug=category_slug)
            
        return queryset

class BannerViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Banners (Hero sections, promotions)
    Read-only for frontend consumption
    """
    serializer_class = BannerSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        from django.utils import timezone
        now = timezone.now()
        
        queryset = Banner.objects.filter(is_active=True)
        
        # Filter by date range
        queryset = queryset.filter(
            models.Q(start_date__isnull=True) | models.Q(start_date__lte=now)
        ).filter(
            models.Q(end_date__isnull=True) | models.Q(end_date__gte=now)
        )
        
        # Filter by placement if provided
        placement = self.request.query_params.get('placement', None)
        if placement:
            queryset = queryset.filter(placement=placement)
        
        return queryset.order_by('display_order', '-created_at')
