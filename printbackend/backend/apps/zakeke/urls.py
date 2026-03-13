from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ZakekeViewSet, ZakekeWebhookView

router = DefaultRouter()
router.register(r'', ZakekeViewSet, basename='zakeke')

urlpatterns = [
    # Zakeke Webhook — receives print file ready notifications
    path('webhook/', ZakekeWebhookView.as_view(), name='zakeke-webhook'),

    # ── Zakeke Product Catalog API endpoints ──
    # Zakeke calls these based on the base URL you set in the Zakeke backoffice
    # ("Sales Channels" page). If you set it to: https://api.printdoot.com/api/v1/zakeke/
    # then Zakeke will call:
    #   GET  /api/v1/zakeke/                          → product list (handled by router's list action)
    #   GET  /api/v1/zakeke/{product_code}/options     → product options
    #   POST /api/v1/zakeke/{product_code}/customizer  → mark customizable
    #   DELETE /api/v1/zakeke/{product_code}/customizer → unmark customizable

    # Direct paths for Zakeke's {product_code}/options and {product_code}/customizer
    path('<str:pk>/options/', ZakekeViewSet.as_view({'get': 'product_options'}), name='zakeke-options'),
    path('<str:pk>/options', ZakekeViewSet.as_view({'get': 'product_options'}), name='zakeke-options-noslash'),
    path('<str:pk>/customizer/', ZakekeViewSet.as_view({'post': 'customizer_status', 'delete': 'customizer_status'}), name='zakeke-customizer'),
    path('<str:pk>/customizer', ZakekeViewSet.as_view({'post': 'customizer_status', 'delete': 'customizer_status'}), name='zakeke-customizer-noslash'),

    # Backward-compatible aliases (in case old catalog/ prefix is used somewhere)
    path('catalog/<str:pk>/options/', ZakekeViewSet.as_view({'get': 'product_options'}), name='zakeke-options-catalog-alias'),
    path('catalog/<str:pk>/options', ZakekeViewSet.as_view({'get': 'product_options'}), name='zakeke-options-catalog-alias-noslash'),
    path('catalog/<str:pk>/customizer/', ZakekeViewSet.as_view({'post': 'customizer_status', 'delete': 'customizer_status'}), name='zakeke-customizer-catalog-alias'),
    path('catalog/<str:pk>/customizer', ZakekeViewSet.as_view({'post': 'customizer_status', 'delete': 'customizer_status'}), name='zakeke-customizer-catalog-alias-noslash'),
    
    # Router handles: GET /api/v1/zakeke/ (list), and other action endpoints like /token/, /catalog/, /test_auth/, etc.
    path('', include(router.urls)),
]
