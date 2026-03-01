from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from .views import CategoryViewSet, SubcategoryViewSet, ProductViewSet, ProductReviewViewSet, BannerViewSet, FavoriteViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'reviews', ProductReviewViewSet, basename='review')
router.register(r'banners', BannerViewSet, basename='banner')
router.register(r'favorites', FavoriteViewSet, basename='favorite')


# Nested routes
category_router = routers.NestedSimpleRouter(router, r'categories', lookup='category')
category_router.register(r'subcategories', SubcategoryViewSet, basename='category-subcategories')

subcategory_router = routers.NestedSimpleRouter(category_router, r'subcategories', lookup='subcategory')
subcategory_router.register(r'products', ProductViewSet, basename='subcategory-products')

# Nested reviews under products: /products/{pk}/reviews/
product_review_router = routers.NestedSimpleRouter(router, r'products', lookup='product')
product_review_router.register(r'reviews', ProductReviewViewSet, basename='product-reviews')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(category_router.urls)),
    path('', include(subcategory_router.urls)),
    path('', include(product_review_router.urls)),
]
