from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from .models import Category, Subcategory, Product, ProductReview, Banner, Favorite
from .serializers import (
    CategorySerializer, SubcategorySerializer, ProductSerializer,
    ProductReviewSerializer, BannerSerializer, FavoriteSerializer,
)

# ── CloudFront cache helpers ──────────────────────────────────────────────────
# s-maxage = CDN (CloudFront) TTL | max-age = browser TTL
def cache_public(response, cdn_seconds=300, browser_seconds=60, stale=120):
    """Add Cache-Control headers that CloudFront will respect for public GET responses."""
    response['Cache-Control'] = (
        f'public, max-age={browser_seconds}, s-maxage={cdn_seconds}, '
        f'stale-while-revalidate={stale}'
    )
    response['Vary'] = 'Accept-Encoding, Accept'
    return response


class ReadOnlyOrAdmin(permissions.BasePermission):
    """
    Allow read access to everyone, write access only to admin/staff.
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

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        if request.method == 'GET':
            cache_public(response, cdn_seconds=600, browser_seconds=120)  # 10 min CDN, 2 min browser
        return response

    @action(detail=False, methods=['get'], url_path='by-slug/(?P<slug>[^/.]+)')
    def by_slug(self, request, slug=None):
        """GET /api/v1/categories/by-slug/{slug}/"""
        try:
            category = Category.objects.get(slug=slug, is_active=True)
            serializer = self.get_serializer(category)
            response = Response(serializer.data)
            cache_public(response, cdn_seconds=600, browser_seconds=120)
            return response
        except Category.DoesNotExist:
            return Response({"detail": "Category not found."}, status=status.HTTP_404_NOT_FOUND)

class SubcategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Subcategories.
    Read: Public. Write: Admin/Staff only.
    """
    queryset = Subcategory.objects.filter(is_active=True).select_related('category').order_by('display_order')
    serializer_class = SubcategorySerializer
    permission_classes = [ReadOnlyOrAdmin]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'category__name']

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        if request.method == 'GET':
            cache_public(response, cdn_seconds=600, browser_seconds=120)
        return response

    def get_queryset(self):
        queryset = super().get_queryset()
        category_pk = self.kwargs.get('category_pk')
        if category_pk:
            queryset = queryset.filter(category_id=category_pk)
        return queryset

class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Products.
    Read: Public. Write: Admin/Staff only.
    """
    queryset = Product.objects.filter(is_active=True).select_related('subcategory__category')
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

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        # Only cache public (unauthenticated) requests
        if request.method == 'GET' and not request.user.is_authenticated:
            cache_public(response, cdn_seconds=300, browser_seconds=60)  # 5 min CDN, 1 min browser
        return response

    @action(detail=False, methods=['get'], url_path='by-slug/(?P<slug>[^/.]+)')
    def by_slug(self, request, slug=None):
        """
        Retrieve a single product by its slug.
        GET /api/v1/products/by-slug/{slug}/
        """
        try:
            product = Product.objects.select_related('subcategory__category').get(slug=slug, is_active=True)
            serializer = self.get_serializer(product)
            response = Response(serializer.data)
            cache_public(response, cdn_seconds=900, browser_seconds=120)  # 15 min CDN for single product
            return response
        except Product.DoesNotExist:
            return Response(
                {"detail": "Product not found."},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'], url_path='new-arrivals')
    def new_arrivals(self, request):
        """
        GET /api/v1/products/new-arrivals/?limit=10
        Returns the most recently created active products.
        """
        limit = min(int(request.query_params.get('limit', 10)), 30)
        products = Product.objects.filter(is_active=True).select_related('subcategory__category').order_by('-created_at')[:limit]
        serializer = self.get_serializer(products, many=True)
        response = Response(serializer.data)
        cache_public(response, cdn_seconds=300, browser_seconds=60)
        return response

    @action(detail=False, methods=['get'], url_path='trending')
    def trending(self, request):
        """
        GET /api/v1/products/trending/?limit=10
        Returns the most popular products based on view_count + order_count.
        """
        limit = min(int(request.query_params.get('limit', 10)), 30)
        products = Product.objects.filter(is_active=True).select_related('subcategory__category').annotate(
            popularity=models.F('view_count') + models.F('order_count') * 3
        ).order_by('-popularity', '-created_at')[:limit]
        serializer = self.get_serializer(products, many=True)
        response = Response(serializer.data)
        cache_public(response, cdn_seconds=300, browser_seconds=60)
        return response

    @action(detail=True, methods=['post'], url_path='track-view', permission_classes=[permissions.AllowAny])
    def track_view(self, request, pk=None):
        """
        POST /api/v1/products/{id}/track-view/
        Atomically increment the view_count of a product.
        """
        try:
            Product.objects.filter(pk=pk, is_active=True).update(
                view_count=models.F('view_count') + 1
            )
            return Response({'status': 'ok'})
        except Exception:
            return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'], url_path='by-ids')
    def by_ids(self, request):
        """
        GET /api/v1/products/by-ids/?ids=1,2,3
        Returns products matching the given IDs (for recently-viewed, etc.).
        """
        ids_param = request.query_params.get('ids', '')
        if not ids_param:
            return Response([])
        try:
            ids = [int(i) for i in ids_param.split(',') if i.strip().isdigit()]
        except (ValueError, TypeError):
            return Response([])
        if not ids:
            return Response([])
        products = Product.objects.filter(id__in=ids, is_active=True).select_related('subcategory__category')
        product_map = {p.id: p for p in products}
        ordered = [product_map[pid] for pid in ids if pid in product_map]
        serializer = self.get_serializer(ordered, many=True)
        return Response(serializer.data)


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
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]  # Public read, any auth user can post
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

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        cache_public(response, cdn_seconds=300, browser_seconds=60)
        return response

    def get_queryset(self):
        from django.utils import timezone
        now = timezone.now()
        queryset = Banner.objects.filter(is_active=True)
        queryset = queryset.filter(
            models.Q(start_date__isnull=True) | models.Q(start_date__lte=now)
        ).filter(
            models.Q(end_date__isnull=True) | models.Q(end_date__gte=now)
        )
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
