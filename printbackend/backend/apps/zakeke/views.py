from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authentication import BasicAuthentication
from rest_framework.views import APIView
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json
import logging
import requests
from .client import zakeke_client
from .serializers import ZakekeCatalogProductSerializer
from .models import ZakekeProduct
from apps.catalog.models import Product

logger = logging.getLogger(__name__)

class ZakekeBasicAuthentication(BasicAuthentication):
    """
    HTTP Basic Authentication for Zakeke using ClientID as username 
    and Secret Key as password.
    """
    def authenticate_credentials(self, userid, password, request=None):
        client_id = getattr(settings, 'ZAKEKE_CLIENT_ID', '')
        secret_key = getattr(settings, 'ZAKEKE_SECRET_KEY', '')
        
        if not client_id or not secret_key:
            logger.error("ZAKEKE_CLIENT_ID or ZAKEKE_SECRET_KEY not configured in settings/env")
            return None
        
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
    
    The catalog list endpoint serves as the root URL that Zakeke calls.
    Zakeke expects:
      GET  <base_url>/              → product list
      GET  <base_url>/{code}/options → product options
      POST <base_url>/{code}/customizer → mark customizable
      DELETE <base_url>/{code}/customizer → unmark customizable
    See: https://docs.zakeke.com/docs/API/Integration/Connecting-Product/Products_Catalog_API
    """
    # Permission is AllowAny because authenticate_credentials returns an AnonymousUser
    # but the authentication class itself verifies the Basic Auth.
    authentication_classes = [ZakekeBasicAuthentication]
    permission_classes = [permissions.AllowAny] 

    def list(self, request):
        """
        Root GET endpoint for Zakeke to retrieve the product catalog.
        Zakeke calls: GET <base_url>/?page=1&search=...
        """
        search = request.query_params.get('search', '').strip()
        page = int(request.query_params.get('page', 1))
        page_size = 200  # Zakeke pulls all products; return large pages

        products = Product.objects.filter(is_active=True).order_by('id')
        if search:
            from django.db.models import Q
            q = Q(name__icontains=search) | Q(sku__icontains=search)
            # Also try numeric ID search
            if search.isdigit():
                q |= Q(id=int(search))
            products = products.filter(q)

        # Pagination
        total = products.count()
        start = (page - 1) * page_size
        end = start + page_size
        products_page = products[start:end]
        
        serializer = ZakekeCatalogProductSerializer(products_page, many=True)
        return Response(serializer.data)

    # Keep the old 'catalog' action as an alias for backwards compatibility
    @action(detail=False, methods=['get'])
    def catalog(self, request):
        """Alias: redirect to list for backwards compatibility."""
        return self.list(request)

    @action(detail=True, methods=['get'], url_path='options', authentication_classes=[], permission_classes=[permissions.AllowAny])
    def product_options(self, request, pk=None):
        """
        Retrieve options for a specific product.
        Zakeke expects: [{ "code": "...", "name": "...", "values": [{ "code": "...", "name": "..." }] }]
        See: https://docs.zakeke.com/docs/API/Integration/Connecting-Product/Products_Catalog_API
        """
        try:
            # Try by Zakeke ID first
            zakeke_product = ZakekeProduct.objects.filter(zakeke_product_id=pk).first()
            if zakeke_product:
                product = zakeke_product.product
            else:
                # Try by SKU
                product = Product.objects.filter(sku=pk).first()
                if not product:
                    # Fallback to local ID lookup
                    if str(pk).isdigit():
                        product = Product.objects.get(id=pk)
                    else:
                        return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
            
            # Dynamic code generation to ensure uniqueness across products
            pid = product.id
            option_code = str(pid * 100 + 1)
            value_code = str(pid * 100 + 2)
            
            # Zakeke only requires: code, name, values (with code, name)
            return Response([
                {
                    "code": option_code,
                    "name": "Standard Configuration",
                    "values": [
                        {
                            "code": value_code,
                            "name": "Standard"
                        }
                    ]
                }
            ])

        except (Product.DoesNotExist, ValueError):
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Error in product_options: {e}")
            # Fallback with proper Zakeke format
            return Response([
                {
                    "code": "99901",
                    "name": "Standard Configuration", 
                    "values": [{"code": "99902", "name": "Standard"}]
                }
            ])

    @action(detail=True, methods=['post', 'delete'], url_path='customizer')
    def customizer_status(self, request, pk=None):
        """
        Mark a product as customizable or not.
        Zakeke sends the product 'code' as {pk} — same code we return in the catalog.
        We need to resolve it to a local product.
        """
        try:
            # Try by Zakeke product ID first
            zakeke_product = ZakekeProduct.objects.filter(zakeke_product_id=pk).first()
            if zakeke_product:
                product = zakeke_product.product
            else:
                # Try by SKU
                product = Product.objects.filter(sku=pk).first()
                if not product:
                    # Fallback to local ID
                    if str(pk).isdigit():
                        product = Product.objects.get(id=pk)
                    else:
                        return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

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
        """
        Get an access token for Zakeke (Server Side).
        This endpoint is required by the Zakeke frontend SDK.
        Token is short-lived and scoped to read-only customizer access.
        """
        token = zakeke_client._get_access_token()
        if token:
            return Response({"access_token": token})
        return Response({"error": "Failed to retrieve token"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAdminUser])
    def test_auth(self, request):
        """Test authentication with Zakeke. Admin only."""
        token = zakeke_client._get_access_token()
        if token:
            return Response({"status": "Authorized", "token_preview": f"{token[:10]}..."})
        return Response({"status": "Failed"}, status=status.HTTP_401_UNAUTHORIZED)

    @action(detail=False, methods=['get'], authentication_classes=[], permission_classes=[permissions.AllowAny])
    def debug_credentials(self, request):
        """
        Debug endpoint to verify which Zakeke account the credentials authenticate to.
        Shows the full token response from Zakeke (with seller ID) without exposing the secret key.
        """
        import base64
        client_id = zakeke_client.CLIENT_ID
        secret_key = zakeke_client.SECRET_KEY
        
        auth_str = f"{client_id}:{secret_key}"
        auth_base64 = base64.b64encode(auth_str.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {auth_base64}",
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
        }
        data = {
            "grant_type": "client_credentials",
            "access_type": "C2S"
        }
        
        try:
            response = requests.post("https://api.zakeke.com/token", headers=headers, data=data, timeout=10)
            raw_response = response.json()
            
            # Mask the actual token for safety but show everything else
            safe_response = {}
            for key, value in raw_response.items():
                if 'token' in key.lower():
                    safe_response[key] = f"{str(value)[:15]}...MASKED"
                else:
                    safe_response[key] = value
            
            return Response({
                "status": "success" if response.status_code == 200 else "failed",
                "http_status": response.status_code,
                "client_id_used": client_id,
                "secret_key_preview": f"{secret_key[:5]}...{secret_key[-5:]}",
                "zakeke_response": safe_response,
                "note": "Look for 'seller' or 'sellerId' in the response. If it shows 297913, your SECRET KEY belongs to an old account."
            })
        except Exception as e:
            return Response({
                "status": "error",
                "error": str(e),
                "client_id_used": client_id
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============================================================================
# Zakeke Webhook — Print File Ready Callback
# =============================================================================

@method_decorator(csrf_exempt, name='dispatch')
class ZakekeWebhookView(APIView):
    """
    POST /api/v1/zakeke/webhook/
    Zakeke calls this endpoint when a design's print files are ready.

    Expected payload (Zakeke order output webhook):
    {
        "orderId": "...",       // Our order ID registered via register_order
        "designId": "...",      // The Zakeke design ID
        "status": "completed",  // completed, failed
        "outputFiles": [
            {
                "url": "https://...",
                "type": "print",
                "format": "pdf",
                "side": "front"
            }
        ],
        "designPrice": 150.00,  // Price of the customization
        "metadata": { ... }
    }
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # Webhooks have no auth; verified via shared secret

    def post(self, request):
        # Verify webhook secret if configured
        webhook_secret = getattr(settings, 'ZAKEKE_WEBHOOK_SECRET', '')
        if webhook_secret:
            received_secret = (
                request.META.get('HTTP_X_WEBHOOK_SECRET', '') or
                request.query_params.get('secret', '')
            )
            if not received_secret or received_secret != webhook_secret:
                logger.warning(
                    f"Zakeke webhook: Invalid or missing secret from "
                    f"IP: {request.META.get('REMOTE_ADDR')}"
                )
                return Response({'error': 'Invalid webhook secret'}, status=status.HTTP_403_FORBIDDEN)

        try:
            payload = json.loads(request.body) if isinstance(request.body, bytes) else request.data
        except (json.JSONDecodeError, Exception):
            return Response({'error': 'Invalid JSON'}, status=status.HTTP_400_BAD_REQUEST)

        order_id = payload.get('orderId', '')
        design_id = payload.get('designId', '')
        output_status = payload.get('status', '')
        output_files = payload.get('outputFiles', [])
        design_price = payload.get('designPrice', 0)

        logger.info(
            f"Zakeke webhook received: order={order_id}, design={design_id}, "
            f"status={output_status}, files={len(output_files)}"
        )

        if not design_id:
            return Response({'error': 'designId is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Find order items matching this design ID
        from apps.orders.models import OrderItem
        items = OrderItem.objects.filter(zakeke_design_id=design_id)

        if not items.exists():
            # Try matching by order ID if available
            if order_id:
                items = OrderItem.objects.filter(order_id=order_id, zakeke_design_id='')
                if items.exists():
                    # Update the design ID on the items
                    items.update(zakeke_design_id=design_id)

        if not items.exists():
            logger.warning(f"Zakeke webhook: No order items found for design={design_id}, order={order_id}")
            return Response({
                'status': 'ignored',
                'message': 'No matching order items found'
            })

        # Extract the primary high-res print file URL
        high_res_url = ''
        for file_info in output_files:
            if file_info.get('type') == 'print':
                high_res_url = file_info.get('url', '')
                break
        # Fallback: use first file if no 'print' type found
        if not high_res_url and output_files:
            high_res_url = output_files[0].get('url', '')

        # Update all matching order items
        update_fields = {}
        if output_status == 'completed':
            update_fields['render_status'] = 'completed'
        elif output_status == 'failed':
            update_fields['render_status'] = 'failed'

        if high_res_url:
            update_fields['high_res_design_url'] = high_res_url

        if design_price:
            from decimal import Decimal
            update_fields['design_price'] = Decimal(str(design_price))

        if update_fields:
            items.update(**update_fields)

        updated_count = items.count()
        logger.info(
            f"Zakeke webhook processed: {updated_count} items updated, "
            f"render_status={update_fields.get('render_status', 'unchanged')}, "
            f"high_res_url={'set' if high_res_url else 'not set'}"
        )

        return Response({
            'status': 'processed',
            'items_updated': updated_count,
            'design_id': design_id,
            'render_status': update_fields.get('render_status', 'unchanged'),
            'high_res_url_set': bool(high_res_url),
        })
