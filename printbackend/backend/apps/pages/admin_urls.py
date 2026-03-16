from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .admin_views import AdminOfferViewSet, AdminBannerViewSet

router = DefaultRouter()
router.register('offers', AdminOfferViewSet, basename='admin-offers')
router.register('banners', AdminBannerViewSet, basename='admin-banners')

urlpatterns = [
    path('', include(router.urls)),
]
