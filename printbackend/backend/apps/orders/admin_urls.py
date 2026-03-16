"""Admin URLs for Orders, Analytics, Dashboard, and Marketing."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .admin_views import (
    AdminOrderViewSet,
    DashboardAnalyticsView,
    SalesOrderAnalyticsView,
    UserAnalyticsView,
    ProductAnalyticsView,
    StockAlertView,
    CourierDashboardView,
    ShipmentTrackAdminView,
)
from .marketing_views import (
    CampaignViewSet,
    AbandonedCartViewSet,
    MarketingSettingsView,
)

router = DefaultRouter()
router.register(r'orders', AdminOrderViewSet, basename='admin-orders')
router.register(r'campaigns', CampaignViewSet, basename='admin-campaigns')
router.register(r'abandoned-carts', AbandonedCartViewSet, basename='admin-abandoned-carts')

urlpatterns = [
    path('', include(router.urls)),

    # Dashboard & Analytics
    path('dashboard/analytics/', DashboardAnalyticsView.as_view(), name='admin-dashboard-analytics'),
    path('analytics/sales-orders/', SalesOrderAnalyticsView.as_view(), name='admin-sales-order-analytics'),
    path('analytics/users/', UserAnalyticsView.as_view(), name='admin-user-analytics'),
    path('analytics/products/', ProductAnalyticsView.as_view(), name='admin-product-analytics'),
    path('stock-alerts/', StockAlertView.as_view(), name='admin-stock-alerts'),

    # Marketing Settings
    path('marketing/settings/', MarketingSettingsView.as_view(), name='admin-marketing-settings'),

    # Courier / Shipment Management
    path('courier/dashboard/', CourierDashboardView.as_view(), name='admin-courier-dashboard'),
    path('courier/track/<int:shipment_id>/', ShipmentTrackAdminView.as_view(), name='admin-shipment-track'),
]

