from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SavedDesignViewSet, AssetViewSet, TemplateViewSet, FontViewSet

router = DefaultRouter()
router.register(r'my-designs', SavedDesignViewSet, basename='design')
router.register(r'assets', AssetViewSet, basename='asset')
router.register(r'templates', TemplateViewSet, basename='template')
router.register(r'fonts', FontViewSet, basename='font')

urlpatterns = [
    path('', include(router.urls)),
]
