"""
Security Middleware
====================
Provides:
1. Request rate logging for suspicious activity detection
2. IP-based blocking for known bad actors
3. Security headers injection
4. Request size limiting to prevent DoS
"""

import logging
import time
from django.conf import settings
from django.http import JsonResponse
from django.core.cache import cache

security_logger = logging.getLogger('security')

# Maximum request body size (10 MB — prevents large payload DoS)
MAX_REQUEST_BODY_SIZE = 10 * 1024 * 1024  # 10 MB


class SecurityHeadersMiddleware:
    """
    Injects additional security headers into every response.
    Django's SecurityMiddleware handles some, but we add extras.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Prevent MIME type sniffing
        response['X-Content-Type-Options'] = 'nosniff'

        # Prevent embedding in iframes (clickjacking)
        response['X-Frame-Options'] = 'DENY'

        # Referrer policy
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        # Permissions policy — disable unnecessary browser features
        response['Permissions-Policy'] = (
            'camera=(), microphone=(), geolocation=(), '
            'payment=(self), usb=(), magnetometer=(), '
            'gyroscope=(), accelerometer=()'
        )

        # Content Security Policy for API responses
        if not request.path.startswith('/admin/'):
            response['Content-Security-Policy'] = "default-src 'none'; frame-ancestors 'none'"

        # Prevent caching of sensitive data
        if request.user and hasattr(request.user, 'is_authenticated') and request.user.is_authenticated:
            response['Cache-Control'] = 'no-store, no-cache, must-revalidate, private'
            response['Pragma'] = 'no-cache'

        return response


class RequestSizeLimitMiddleware:
    """
    Rejects requests with excessively large bodies to prevent DoS attacks.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        content_length = request.META.get('CONTENT_LENGTH')
        if content_length:
            try:
                if int(content_length) > MAX_REQUEST_BODY_SIZE:
                    security_logger.warning(
                        f"Request body too large ({content_length} bytes) from "
                        f"IP: {self._get_ip(request)}"
                    )
                    return JsonResponse(
                        {'error': 'Request body too large.'},
                        status=413
                    )
            except (ValueError, TypeError):
                pass

        return self.get_response(request)

    @staticmethod
    def _get_ip(request):
        xff = request.META.get('HTTP_X_FORWARDED_FOR')
        return xff.split(',')[0].strip() if xff else request.META.get('REMOTE_ADDR', 'Unknown')


class BruteForceProtectionMiddleware:
    """
    Detects and blocks IPs making excessive failed login/auth attempts.
    Uses Django's cache framework (works with memcached/redis in production).
    """
    # Max failed auth attempts before temporary ban
    MAX_FAILURES = 20
    # Ban duration in seconds (30 minutes)
    BAN_DURATION = 30 * 60
    # Tracking window in seconds (1 hour)
    TRACK_WINDOW = 60 * 60
    # Localhost IPs that should never be banned during development
    LOCALHOST_IPS = {'127.0.0.1', '::1', 'localhost'}

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        ip = self._get_ip(request)

        # Never ban localhost IPs in development mode
        if settings.DEBUG and ip in self.LOCALHOST_IPS:
            return self.get_response(request)

        # Check if IP is banned
        ban_key = f'security:banned:{ip}'
        if cache.get(ban_key):
            security_logger.warning(f"Blocked request from banned IP: {ip}")
            return JsonResponse(
                {'error': 'Too many failed attempts. Please try again later.'},
                status=429
            )

        response = self.get_response(request)

        # Track failed authentication attempts (401 responses)
        if response.status_code == 401:
            fail_key = f'security:auth_fails:{ip}'
            failures = cache.get(fail_key, 0) + 1
            cache.set(fail_key, failures, self.TRACK_WINDOW)

            if failures >= self.MAX_FAILURES:
                cache.set(ban_key, True, self.BAN_DURATION)
                security_logger.error(
                    f"IP BANNED for {self.BAN_DURATION}s due to {failures} "
                    f"failed auth attempts: {ip}"
                )

        return response

    @staticmethod
    def _get_ip(request):
        xff = request.META.get('HTTP_X_FORWARDED_FOR')
        return xff.split(',')[0].strip() if xff else request.META.get('REMOTE_ADDR', 'Unknown')


class SuspiciousActivityMiddleware:
    """
    Logs suspicious patterns:
    - Rapid-fire requests from same IP
    - SQL injection attempts in query params
    - Path traversal attempts
    """
    # Common SQL injection patterns
    SQL_PATTERNS = [
        "' OR ", "'; DROP", "UNION SELECT", "1=1", "' --",
        "admin'--", "OR 1=1", "' OR '1'='1",
        "EXEC ", "EXECUTE ", "INSERT INTO", "DELETE FROM",
        "UPDATE SET", "DROP TABLE", "ALTER TABLE",
    ]

    # Path traversal patterns
    TRAVERSAL_PATTERNS = ['../', '..\\', '%2e%2e', '%252e']

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        import urllib.parse
        ip = self._get_ip(request)
        path = request.get_full_path()

        # URL-decode the full path to catch encoded injection attempts
        decoded_path = urllib.parse.unquote(urllib.parse.unquote(path))

        # Check for SQL injection in URL params (both raw and decoded)
        for check_str in [path.upper(), decoded_path.upper()]:
            for pattern in self.SQL_PATTERNS:
                if pattern.upper() in check_str:
                    security_logger.error(
                        f"SQL injection attempt detected from IP: {ip} | "
                        f"Path: {path}"
                    )
                    return JsonResponse(
                        {'error': 'Bad request.'},
                        status=400
                    )

        # Check for path traversal (both raw and decoded)
        for check_str in [path.lower(), decoded_path.lower()]:
            for pattern in self.TRAVERSAL_PATTERNS:
                if pattern in check_str:
                    security_logger.error(
                        f"Path traversal attempt detected from IP: {ip} | "
                        f"Path: {path}"
                    )
                    return JsonResponse(
                        {'error': 'Bad request.'},
                        status=400
                    )

        return self.get_response(request)

    @staticmethod
    def _get_ip(request):
        xff = request.META.get('HTTP_X_FORWARDED_FOR')
        return xff.split(',')[0].strip() if xff else request.META.get('REMOTE_ADDR', 'Unknown')
