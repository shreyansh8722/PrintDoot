"""
Custom DRF Throttle Classes
============================
Scoped throttles for sensitive endpoints to prevent abuse.
"""

from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class RegisterThrottle(AnonRateThrottle):
    """Limits registration attempts — prevents mass account creation."""
    scope = 'register'


class LoginThrottle(AnonRateThrottle):
    """Limits login attempts — prevents brute force attacks."""
    scope = 'login'


class PasswordResetThrottle(AnonRateThrottle):
    """Limits password reset requests — prevents email bombing."""
    scope = 'password_reset'


class ContactFormThrottle(AnonRateThrottle):
    """Limits contact form submissions — prevents spam."""
    scope = 'contact'


class OrderCreateThrottle(UserRateThrottle):
    """Limits order creation — prevents fake order flooding."""
    scope = 'order_create'


class PaymentThrottle(UserRateThrottle):
    """Limits payment operations — prevents payment abuse."""
    scope = 'payment'


class ShippingThrottle(AnonRateThrottle):
    """Limits shipping rate/serviceability lookups — prevents Shipmozo API quota abuse."""
    scope = 'shipping'
