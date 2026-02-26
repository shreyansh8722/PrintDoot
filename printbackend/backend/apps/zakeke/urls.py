from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ZakekeViewSet, ZakekeWebhookView

router = DefaultRouter()
router.register(r'', ZakekeViewSet, basename='zakeke')

urlpatterns = [
    # Zakeke Webhook — receives print file ready notifications
    path('webhook/', ZakekeWebhookView.as_view(), name='zakeke-webhook'),

    # Alias for when Zakeke appends IDs to the catalog endpoint base URL
    # Logs show Zakeke requesting: /api/v1/zakeke/catalog/<ID>/options
    path('catalog/<str:pk>/options', ZakekeViewSet.as_view({'get': 'product_options'}), name='zakeke-options-catalog-alias'),
    
    # 404 FIX: Zakeke also calls customizer on the catalog path
    # POST /api/v1/zakeke/catalog/<ID>/customizer
    path('catalog/<str:pk>/customizer', ZakekeViewSet.as_view({'post': 'customizer_status', 'delete': 'customizer_status'}), name='zakeke-customizer-catalog-alias'),

    # Explicitly handle no-slash for Zakeke options endpoint
    path('<str:pk>/options', ZakekeViewSet.as_view({'get': 'product_options'}), name='zakeke-options-noslash'),
    path('<str:pk>/customizer', ZakekeViewSet.as_view({'post': 'customizer_status', 'delete': 'customizer_status'}), name='zakeke-customizer-noslash'),
    
    path('', include(router.urls)),
]
