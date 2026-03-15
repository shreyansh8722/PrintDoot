from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from .views import CategoryViewSet, SubcategoryViewSet, ProductViewSet, BannerViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'banners', BannerViewSet, basename='banner')


# Nested routes
category_router = routers.NestedSimpleRouter(router, r'categories', lookup='category')
category_router.register(r'subcategories', SubcategoryViewSet, basename='category-subcategories')

subcategory_router = routers.NestedSimpleRouter(category_router, r'subcategories', lookup='subcategory')
subcategory_router.register(r'products', ProductViewSet, basename='subcategory-products')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(category_router.urls)),
    path('', include(subcategory_router.urls)),
]
