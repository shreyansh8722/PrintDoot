from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from .models import Category, Subcategory, Product, ProductReview, Banner, Favorite
from .serializers import (
    CategorySerializer, SubcategorySerializer, ProductSerializer,
    ProductReviewSerializer, BannerSerializer, FavoriteSerializer,
)


class ReadOnlyOrAdmin(permissions.BasePermission):
    """
    Allow read access to everyone, write access only to admin/staff.
    Prevents regular authenticated users from creating/editing/deleting catalog items.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated and (
            request.user.is_staff or request.user.is_superuser
        )


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Categories (Top Level).
    Read: Public. Write: Admin/Staff only.
    """
    queryset = Category.objects.filter(is_active=True).order_by('display_order')
    serializer_class = CategorySerializer
    permission_classes = [ReadOnlyOrAdmin]

    @action(detail=False, methods=['get'], url_path='by-slug/(?P<slug>[^/.]+)')
    def by_slug(self, request, slug=None):
        """GET /api/v1/categories/by-slug/{slug}/"""
        try:
            category = Category.objects.get(slug=slug, is_active=True)
            serializer = self.get_serializer(category)
            return Response(serializer.data)
        except Category.DoesNotExist:
            return Response({"detail": "Category not found."}, status=status.HTTP_404_NOT_FOUND)

class SubcategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Subcategories.
    Read: Public. Write: Admin/Staff only.
    """
    queryset = Subcategory.objects.filter(is_active=True).order_by('display_order')
    serializer_class = SubcategorySerializer
    permission_classes = [ReadOnlyOrAdmin]
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
    Read: Public. Write: Admin/Staff only.
    Supports filtering by: category, subcategory (slugs), featured, min_price, max_price, min_rating.
    Supports search by: name, sku, description.
    Supports ordering by: base_price, created_at, name, avg_rating.
    """
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    permission_classes = [ReadOnlyOrAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'slug', 'sku', 'description']
    ordering_fields = ['base_price', 'created_at', 'name']

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

        # Filter by featured
        featured = self.request.query_params.get('featured', None)
        if featured is not None and featured.lower() in ('true', '1', 'yes'):
            queryset = queryset.filter(is_featured=True)

        # Filter by price range (uses base_price; final_price is a property so can't filter in DB)
        min_price = self.request.query_params.get('min_price', None)
        if min_price is not None:
            try:
                queryset = queryset.filter(base_price__gte=float(min_price))
            except (ValueError, TypeError):
                pass

        max_price = self.request.query_params.get('max_price', None)
        if max_price is not None:
            try:
                queryset = queryset.filter(base_price__lte=float(max_price))
            except (ValueError, TypeError):
                pass

        # Filter by minimum average rating
        min_rating = self.request.query_params.get('min_rating', None)
        if min_rating is not None:
            try:
                min_r = float(min_rating)
                queryset = queryset.annotate(
                    avg_rating=models.Avg('reviews__rating')
                ).filter(avg_rating__gte=min_r)
            except (ValueError, TypeError):
                pass

        # Ordering by avg_rating (special handling since it's an annotation)
        ordering = self.request.query_params.get('ordering', None)
        if ordering in ('avg_rating', '-avg_rating'):
            if not hasattr(queryset.query, 'annotations') or 'avg_rating' not in queryset.query.annotations:
                queryset = queryset.annotate(avg_rating=models.Avg('reviews__rating'))
            queryset = queryset.order_by(ordering)

        return queryset

    @action(detail=False, methods=['get'], url_path='by-slug/(?P<slug>[^/.]+)')
    def by_slug(self, request, slug=None):
        """
        Retrieve a single product by its slug.
        GET /api/v1/products/by-slug/{slug}/
        """
        try:
            product = Product.objects.get(slug=slug, is_active=True)
            serializer = self.get_serializer(product)
            return Response(serializer.data)
        except Product.DoesNotExist:
            return Response(
                {"detail": "Product not found."},
                status=status.HTTP_404_NOT_FOUND
            )


# ========================================
# Reviews ViewSet
# ========================================
class ProductReviewViewSet(viewsets.ModelViewSet):
    """
    CRUD for product reviews.
    - GET  /products/{id}/reviews/  — list reviews for a product (public)
    - POST /products/{id}/reviews/  — submit a review (auth required)
    - GET  /reviews/                — list all reviews (public)
    - GET  /reviews/my/             — list current user's reviews (auth required)
    - POST /reviews/{id}/helpful/   — mark a review as helpful (auth required)
    """
    serializer_class = ProductReviewSerializer
    permission_classes = [ReadOnlyOrAdmin]  # Public read, admin can edit/delete
    http_method_names = ['get', 'post', 'head', 'options']  # No PUT/PATCH/DELETE for regular users
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'rating', 'helpful_count']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = ProductReview.objects.all()
        # If accessed via nested route /products/{pk}/reviews/
        product_pk = self.kwargs.get('product_pk')
        if product_pk:
            queryset = queryset.filter(product_id=product_pk)
        return queryset

    def perform_create(self, serializer):
        product_pk = self.kwargs.get('product_pk')
        # Auto-check if user purchased this product
        from apps.orders.models import Order, OrderItem
        is_verified = OrderItem.objects.filter(
            order__user=self.request.user,
            order__status__in=['Paid', 'Processing', 'Shipped', 'Delivered'],
            product_id=product_pk,
        ).exists()
        serializer.save(
            user=self.request.user,
            product_id=product_pk,
            is_verified_purchase=is_verified,
        )

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my(self, request):
        """GET /reviews/my/ — current user's reviews"""
        reviews = ProductReview.objects.filter(user=request.user).order_by('-created_at')
        page = self.paginate_queryset(reviews)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def helpful(self, request, pk=None, **kwargs):
        """POST /reviews/{id}/helpful/ — increment helpful count"""
        review = self.get_object()
        if review.user == request.user:
            return Response({'detail': 'You cannot mark your own review as helpful.'},
                            status=status.HTTP_400_BAD_REQUEST)
        review.helpful_count += 1
        review.save(update_fields=['helpful_count'])
        return Response({'helpful_count': review.helpful_count})

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


# ========================================
# Favorites ViewSet
# ========================================
class FavoriteViewSet(viewsets.GenericViewSet):
    """
    Manage user favorites (wishlist).
    All endpoints require authentication.
    """
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).select_related('product')

    def list(self, request):
        """GET /api/v1/favorites/ — list user's favorites"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        """POST /api/v1/favorites/toggle/ — add or remove a product from favorites"""
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'detail': 'product_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        favorite, created = Favorite.objects.get_or_create(user=request.user, product=product)
        if not created:
            favorite.delete()
            return Response({'status': 'removed', 'product_id': product.id})
        return Response({'status': 'added', 'product_id': product.id}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def ids(self, request):
        """GET /api/v1/favorites/ids/ — get list of favorited product IDs (lightweight)"""
        ids = list(self.get_queryset().values_list('product_id', flat=True))
        return Response({'product_ids': ids})

    @action(detail=False, methods=['post'])
    def remove(self, request):
        """POST /api/v1/favorites/remove/ — remove a product from favorites"""
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'detail': 'product_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        deleted, _ = Favorite.objects.filter(user=request.user, product_id=product_id).delete()
        if deleted:
            return Response({'status': 'removed', 'product_id': int(product_id)})
        return Response({'detail': 'Not in favorites.'}, status=status.HTTP_404_NOT_FOUND)
