"""
Custom DRF Exception Handler
=============================
Sanitises error responses to prevent information leakage in production.
Logs full errors server-side while returning safe messages to clients.
"""

import logging
import traceback
from django.conf import settings
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger('security')


def custom_exception_handler(exc, context):
    """
    Custom exception handler that:
    1. Logs all errors with full tracebacks for debugging
    2. Sanitises 500 errors in production to prevent info leakage
    3. Adds request metadata to logs for security auditing
    """
    # Call DRF's default handler first
    response = exception_handler(exc, context)

    # Extract request info for logging
    request = context.get('request')
    view = context.get('view')
    view_name = view.__class__.__name__ if view else 'Unknown'

    ip = _get_client_ip(request) if request else 'Unknown'
    user = getattr(request, 'user', None) if request else None
    user_info = str(user) if user and user.is_authenticated else 'Anonymous'

    if response is not None:
        # DRF handled this (4xx errors mostly)
        if response.status_code >= 400:
            logger.warning(
                f"API Error {response.status_code} | View: {view_name} | "
                f"User: {user_info} | IP: {ip} | Error: {exc}"
            )
        return response

    # Unhandled exception (500) — DRF returned None
    logger.error(
        f"Unhandled Exception | View: {view_name} | User: {user_info} | "
        f"IP: {ip} | Exception: {exc}\n{traceback.format_exc()}"
    )

    # In production, return generic error — never leak internals
    if not settings.DEBUG:
        return Response(
            {'error': 'An internal server error occurred. Please try again later.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # In DEBUG mode, return the actual error for developer convenience
    return Response(
        {'error': str(exc), 'traceback': traceback.format_exc()},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


def _get_client_ip(request):
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    return xff.split(',')[0].strip() if xff else request.META.get('REMOTE_ADDR', 'Unknown')
