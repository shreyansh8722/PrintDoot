from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrderViewSet, ReturnRequestViewSet, RefundViewSet,
    CreateInstamojoPaymentView, VerifyPaymentView, InstamojoWebhookView, TransactionLogsView,
    CheckServiceabilityView, CalculateShippingView,
    CreateShipmentView, TrackShipmentView, ShiprocketWebhookView,
)

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'returns', ReturnRequestViewSet, basename='return-request')
router.register(r'refunds', RefundViewSet, basename='refund')

urlpatterns = [
    path('', include(router.urls)),

    # ── Module 4: Payments ──
    path('payments/create-order/', CreateInstamojoPaymentView.as_view(), name='payment-create-order'),
    path('payments/verify/', VerifyPaymentView.as_view(), name='payment-verify'),
    path('payments/webhook/', InstamojoWebhookView.as_view(), name='payment-webhook'),
    path('payments/transactions/', TransactionLogsView.as_view(), name='payment-transactions'),
    path('payments/transactions/<int:order_id>/', TransactionLogsView.as_view(), name='payment-transaction-detail'),

    # ── Module 5: Shipping ──
    path('shipping/check-serviceability/', CheckServiceabilityView.as_view(), name='shipping-serviceability'),
    path('shipping/calculate/', CalculateShippingView.as_view(), name='shipping-calculate'),

    # ── Module 6: Tracking ──
    path('tracking/create-shipment/', CreateShipmentView.as_view(), name='tracking-create-shipment'),
    path('tracking/<int:order_id>/', TrackShipmentView.as_view(), name='tracking-detail'),
    path('tracking/webhook/', ShiprocketWebhookView.as_view(), name='tracking-webhook'),
]
