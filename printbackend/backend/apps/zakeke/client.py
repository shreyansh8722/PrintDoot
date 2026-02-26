import requests
import time
import base64
from django.conf import settings

class ZakekeClient:
    """
    Client for interacting with Zakeke API.
    Handles token management and OAuth2 authentication.
    """
    TOKEN_URL = "https://api.zakeke.com/token"

    _instance = None
    _token = None
    _expires_at = 0

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ZakekeClient, cls).__new__(cls)
        return cls._instance

    @property
    def CLIENT_ID(self):
        """Read from settings at runtime so env vars are always current."""
        return getattr(settings, 'ZAKEKE_CLIENT_ID', '')

    @property
    def SECRET_KEY(self):
        """Read from settings at runtime so env vars are always current."""
        return getattr(settings, 'ZAKEKE_SECRET_KEY', '')

    def _get_access_token(self, access_type='C2S', visitorcode=None, customercode=None):
        """Fetch a new access token using client credentials."""
        auth_str = f"{self.CLIENT_ID}:{self.SECRET_KEY}"
        auth_base64 = base64.b64encode(auth_str.encode()).decode()

        headers = {
            "Authorization": f"Basic {auth_base64}",
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
        }
        data = {
            "grant_type": "client_credentials",
            "access_type": access_type
        }
        if visitorcode:
            data['visitorcode'] = visitorcode
        if customercode:
            data['customercode'] = customercode

        try:
            response = requests.post(self.TOKEN_URL, headers=headers, data=data)
            response.raise_for_status()
            token_data = response.json()
            
            # Use hyphenated 'access-token' as per Zakeke docs
            token = token_data.get('access-token')
            if not token:
                # Fallback to underscore just in case, though docs say hyphen
                token = token_data.get('access_token')
                
            return token
        except Exception as e:
            print(f"Error fetching Zakeke token: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response: {e.response.text}")
            return None

    def get_headers(self, s2s=False, visitorcode=None, customercode=None):
        """Return headers with bearer token."""
        access_type = 'S2S' if s2s else 'C2S'
        token = self._get_access_token(access_type=access_type, visitorcode=visitorcode, customercode=customercode)
        if not token:
            return {}
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        return headers

    def get_catalog(self):
        """Placeholder for getting catalog from Zakeke if needed."""
        # This is usually the other way around: Zakeke calls US.
        pass

zakeke_client = ZakekeClient()
