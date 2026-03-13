"""
Custom authentication classes for the PrintDoot API.

The default DRF BasicAuthentication sends a `WWW-Authenticate: Basic` header
on 401 responses. This causes the browser to pop up its native username/password
dialog, which conflicts with our React-based login page.

This module provides a drop-in replacement that suppresses that header.
"""

from rest_framework.authentication import BasicAuthentication


class BasicAuthWithoutPopup(BasicAuthentication):
    """
    Basic Authentication that does NOT trigger the browser's native auth popup.

    DRF's default BasicAuthentication returns `WWW-Authenticate: Basic realm="api"`
    on 401 responses. The browser interprets this header and shows a native
    credential dialog — completely bypassing our React login UI.

    By returning a custom header value instead of "Basic", the browser won't
    recognize it and won't show the popup. The actual Basic Auth mechanism
    still works identically.
    """

    def authenticate_header(self, request):
        # Return a non-standard value so the browser does NOT show its
        # native username/password dialog on 401 responses.
        return 'BasicCustom realm="api"'
