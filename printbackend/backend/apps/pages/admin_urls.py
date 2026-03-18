from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .admin_views import AdminOfferViewSet, AdminBannerViewSet, AdminPromoCodeViewSet, AdminOfflinePaymentViewSet

router = DefaultRouter()
router.register('offers', AdminOfferViewSet, basename='admin-offers')
router.register('banners', AdminBannerViewSet, basename='admin-banners')
router.register('promo-codes', AdminPromoCodeViewSet, basename='admin-promo-codes')
router.register('offline-payments', AdminOfflinePaymentViewSet, basename='admin-offline-payments')

urlpatterns = [
    path('', include(router.urls)),
]
