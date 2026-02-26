from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Category, Subcategory, Product, ProductImage, ProductReview
from .serializers import (
    CategorySerializer, SubcategorySerializer, ProductSerializer,
    ProductImageSerializer, ProductReviewSerializer
)
from apps.users.permissions import IsAdminOrStaff

class AdminCategoryViewSet(viewsets.ModelViewSet):
    """
    Admin-only ViewSet for managing categories.
    """
    queryset = Category.objects.all().order_by('display_order')
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrStaff]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'slug']

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get category statistics"""
        total = Category.objects.count()
        active = Category.objects.filter(is_active=True).count()
        return Response({
            'total': total,
            'active': active,
            'inactive': total - active,
        })

class AdminSubcategoryViewSet(viewsets.ModelViewSet):
    """
    Admin-only ViewSet for managing subcategories.
    """
    queryset = Subcategory.objects.all().select_related('category').order_by('display_order')
    serializer_class = SubcategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrStaff]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'slug', 'category__name']

class AdminProductViewSet(viewsets.ModelViewSet):
    """
    Admin-only ViewSet for managing products.
    """
    queryset = Product.objects.all().select_related('subcategory__category')
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrStaff]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'sku', 'description', 'subcategory__name']
    ordering_fields = ['created_at', 'base_price', 'stock_quantity']
    ordering = ['-created_at']

    @action(detail=False, methods=['post'])
    def bulk_update_stock(self, request):
        """Bulk update stock quantities"""
        updates = request.data.get('updates', [])
        for update in updates:
            product_id = update.get('id')
            stock = update.get('stock_quantity')
            if product_id and stock is not None:
                Product.objects.filter(id=product_id).update(stock_quantity=stock)
        return Response({'status': 'Stock updated'})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get product statistics"""
        total = Product.objects.count()
        active = Product.objects.filter(is_active=True).count()
        low_stock = Product.objects.filter(stock_quantity__lt=10, is_infinite_stock=False).count()
        
        return Response({
            'total': total,
            'active': active,
            'inactive': total - active,
            'low_stock': low_stock,
        })



class AdminProductImageViewSet(viewsets.ModelViewSet):
    """
    Admin-only ViewSet for managing product images.
    """
    queryset = ProductImage.objects.all().select_related('product')
    serializer_class = ProductImageSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrStaff]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        product_id = self.request.query_params.get('product', None)
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset

class AdminProductReviewViewSet(viewsets.ModelViewSet):
    """
    Admin-only ViewSet for managing product reviews.
    """
    queryset = ProductReview.objects.all().select_related('product', 'user')
    serializer_class = ProductReviewSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrStaff]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'comment', 'user__email', 'product__name']
    ordering_fields = ['rating', 'created_at', 'helpful_count']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        product_id = self.request.query_params.get('product', None)
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset
    
    @action(detail=True, methods=['post'])
    def mark_helpful(self, request, pk=None):
        """Increment helpful count"""
        review = self.get_object()
        review.helpful_count += 1
        review.save()
        return Response({'helpful_count': review.helpful_count})

