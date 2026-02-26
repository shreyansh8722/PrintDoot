from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, AddressViewSet,
    PasswordResetRequestView, PasswordResetConfirmView,
    EmailVerifyView, ResendVerificationView,
    PincodeCheckView, ContactFormView,
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'addresses', AddressViewSet, basename='address')

urlpatterns = [
    path('', include(router.urls)),

    # Auth — Password Reset
    path('auth/password-reset/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('auth/password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),

    # Auth — Email Verification
    path('auth/verify-email/', EmailVerifyView.as_view(), name='email-verify'),
    path('auth/resend-verification/', ResendVerificationView.as_view(), name='resend-verification'),

    # Pincode Serviceability Check
    path('pincode-check/', PincodeCheckView.as_view(), name='pincode-check'),

    # Contact Form
    path('contact/', ContactFormView.as_view(), name='contact-form'),
]
