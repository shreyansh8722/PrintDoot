from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authentication import BasicAuthentication
from django.conf import settings
import requests
from .client import zakeke_client
from .serializers import ZakekeCatalogProductSerializer
from .models import ZakekeProduct
from apps.catalog.models import Product

class ZakekeBasicAuthentication(BasicAuthentication):
    """
    HTTP Basic Authentication for Zakeke using ClientID as username 
    and Secret Key as password.
    """
    def authenticate_credentials(self, userid, password, request=None):
        client_id = getattr(settings, 'ZAKEKE_CLIENT_ID', '328125')
        secret_key = getattr(settings, 'ZAKEKE_SECRET_KEY', 'LnptOniAulJlGh5glVDMY45ZYXRUUpA0DWk9lgWto7w.')
        
        if userid == client_id and password == secret_key:
            # We return None for user because Zakeke doesn't map to a local user
            # but we need to pass a "user" object for DRF to consider it authenticated.
            # Using a mock user or None with AllowAny/IsAuthenticated logic.
            from django.contrib.auth.models import AnonymousUser
            return (AnonymousUser(), None)
        return None

class ZakekeViewSet(viewsets.ViewSet):
    """
    ViewSet for Zakeke integration tasks.
    """
    # Permission is AllowAny because authenticate_credentials returns an AnonymousUser
    # but the authentication class itself verifies the Basic Auth.
    authentication_classes = [ZakekeBasicAuthentication]
    permission_classes = [permissions.AllowAny] 

    @action(detail=False, methods=['get'])
    def catalog(self, request):
        """Endpoint for Zakeke to retrieve the product catalog."""
        search = request.query_params.get('search')
        page = int(request.query_params.get('page', 1))
        page_size = 20 # Zakeke doesn't specify size, usually 10-50 is fine.

        products = Product.objects.filter(is_active=True)
        if search:
            products = products.filter(name__icontains=search) | products.filter(id__icontains=search)
            
        # Pagination
        start = (page - 1) * page_size
        end = start + page_size
        products_page = products[start:end]
        
        serializer = ZakekeCatalogProductSerializer(products_page, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='options', authentication_classes=[], permission_classes=[permissions.AllowAny])
    def product_options(self, request, pk=None):
        """Retrieve options for a specific product."""
        # DEBUG MODE: Auth disabled to rule out 401/403 causing Zakeke 500 error.
        
        try:
            # We need the product ID to generate consistent dynamic IDs for options
            # Try by Zakeke ID first
            zakeke_product = ZakekeProduct.objects.filter(zakeke_product_id=pk).first()
            if zakeke_product:
                product = zakeke_product.product
            else:
                # Try by SKU
                product = Product.objects.filter(sku=pk).first()
                if not product:
                    # Fallback to local ID lookup
                    # Handle case where pk might be non-numeric (if it's a UUID/SKU passed here)
                    if str(pk).isdigit():
                        product = Product.objects.get(id=pk)
                    else:
                        # If we can't find the product, return 404
                        return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
            
            # Dynamic ID generation to ensure uniqueness across products
            # We use the product ID as a base.
            # Base ID: product.id
            # Option ID: product.id * 100 + 1
            # Value ID: product.id * 100 + 2
            
            pid = product.id
            option_id = pid * 100 + 1
            value_id = pid * 100 + 2
            
            return Response([
                {
                    "id": option_id,
                    "code": "standard_config",
                    "name": "Standard Configuration",
                    "option_type": "select",
                    "is_required": True,
                    "values": [
                        {
                            "id": value_id,
                            "code": "standard",
                            "name": "Standard",
                            "price": 0.0,
                            "is_default": True,
                            "enabled": True
                        }
                    ]
                }
            ])

        except (Product.DoesNotExist, ValueError):
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Error in product_options: {e}")
            # Fallback to pure dummy generic IDs if something crashes
            return Response([
                {
                    "id": 12345,
                    "code": "standard_config",
                    "name": "Standard Configuration", 
                    "values": [{"id": 67890, "code": "standard", "name": "Standard"}]
                }
            ])

    @action(detail=True, methods=['post', 'delete'], url_path='customizer')
    def customizer_status(self, request, pk=None):
        """Mark a product as customizable or not."""
        try:
            product = Product.objects.get(id=pk)
            if request.method == 'POST':
                # Create or update ZakekeProduct mapping
                ZakekeProduct.objects.get_or_create(
                    product=product,
                    defaults={'zakeke_product_id': pk}
                )
                return Response(status=status.HTTP_200_OK)
            elif request.method == 'DELETE':
                ZakekeProduct.objects.filter(product=product).delete()
                return Response(status=status.HTTP_200_OK)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'], url_path='designs/(?P<design_id>[^/.]+)')
    def design_details(self, request, design_id=None):
        """Fetch design details from Zakeke using S2S token."""
        # Using S2S token as per docs for backend-to-backend calls
        headers = zakeke_client.get_headers(s2s=True)
        url = f"https://api.zakeke.com/v3/designs/{design_id}"
        
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            return Response(response.json())
        except Exception as e:
            return Response(
                {"error": f"Failed to fetch design details: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'], url_path='order')
    def register_order(self, request):
        """Register a local order in Zakeke to generate print files."""
        headers = zakeke_client.get_headers(s2s=True)
        url = "https://api.zakeke.com/v2/order"
        
        try:
            response = requests.post(url, headers=headers, json=request.data)
            response.raise_for_status()
            return Response(response.json())
        except Exception as e:
            return Response(
                {"error": f"Failed to register order in Zakeke: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], authentication_classes=[], permission_classes=[permissions.AllowAny])
    def token(self, request):
        """Get an access token for Zakeke (Server Side)."""
        token = zakeke_client._get_access_token()
        if token:
            return Response({"access_token": token})
        return Response({"error": "Failed to retrieve token"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], authentication_classes=[], permission_classes=[permissions.AllowAny])
    def test_auth(self, request):
        """Test authentication with Zakeke."""
        token = zakeke_client._get_access_token()
        if token:
            return Response({"status": "Authorized", "token_preview": f"{token[:10]}..."})
        return Response({"status": "Failed"}, status=status.HTTP_401_UNAUTHORIZED)
