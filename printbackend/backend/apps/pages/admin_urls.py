from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .admin_views import AdminOfferViewSet

router = DefaultRouter()
router.register('offers', AdminOfferViewSet, basename='admin-offers')

urlpatterns = [
    path('', include(router.urls)),
]
