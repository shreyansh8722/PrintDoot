"""
Shiprocket API Integration Service.

Handles:
- Authentication (email/password token)
- Creating shipment orders
- Tracking shipments by AWB
- Cancelling orders
- Parsing webhook payloads

Shiprocket API Docs: https://apidocs.shiprocket.in/
"""

import logging
import requests
from datetime import datetime
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external'


# =============================================================================
# Authentication
# =============================================================================

_cached_token = None
_token_expires_at = 0


def get_auth_token():
    """
    Authenticate with Shiprocket and return a bearer token.
    Tokens are cached in-memory for the server process lifetime.
    In production, consider Redis caching.
    """
    global _cached_token, _token_expires_at
    import time

    # Reuse cached token if still valid (Shiprocket tokens last ~10 days)
    if _cached_token and time.time() < _token_expires_at:
        return _cached_token

    email = getattr(settings, 'SHIPROCKET_EMAIL', '')
    password = getattr(settings, 'SHIPROCKET_PASSWORD', '')

    if not email or not password:
        raise ValueError("SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD must be set in settings/env.")

    url = f"{SHIPROCKET_BASE_URL}/auth/login"
    payload = {"email": email, "password": password}

    try:
        response = requests.post(url, json=payload, timeout=15)
        response.raise_for_status()
        data = response.json()
        _cached_token = data.get('token')
        # Cache for 9 days (Shiprocket tokens are valid for ~10 days)
        _token_expires_at = time.time() + (9 * 24 * 3600)
        logger.info("Shiprocket auth token obtained successfully.")
        return _cached_token
    except requests.RequestException as e:
        logger.error(f"Shiprocket authentication failed: {e}")
        raise


def _get_headers():
    """Return authorization headers for Shiprocket API calls."""
    token = get_auth_token()
    return {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}',
    }


# =============================================================================
# Create Shipment Order
# =============================================================================

def create_shiprocket_order(order):
    """
    Create a shipment order in Shiprocket from a local Order instance.

    Args:
        order: Order model instance (must be in Paid/Processing/Printing status)

    Returns:
        dict with shiprocket_order_id, shipment_id, awb_code, courier info
    """
    from .models import Shipment

    if not order.shipping_address:
        raise ValueError("Order has no shipping address.")

    addr = order.shipping_address
    items_payload = []

    for item in order.items.select_related('product').all():
        product = item.product
        items_payload.append({
            "name": item.product_name_snapshot or (product.name if product else 'Product'),
            "sku": item.sku_snapshot or (product.sku if product else f'ITEM-{item.id}'),
            "units": item.quantity,
            "selling_price": str(item.unit_price),
            "discount": "0",
            "tax": "0",
            "hsn": "",
        })

    payload = {
        "order_id": str(order.id),
        "order_date": order.created_at.strftime('%Y-%m-%d %H:%M'),
        "pickup_location": getattr(settings, 'SHIPROCKET_PICKUP_LOCATION', 'Primary'),
        "billing_customer_name": order.user.first_name or order.user.username,
        "billing_last_name": order.user.last_name or '',
        "billing_address": addr.address_line1,
        "billing_address_2": addr.address_line2 or '',
        "billing_city": addr.city,
        "billing_pincode": addr.pincode,
        "billing_state": addr.state,
        "billing_country": addr.country or 'India',
        "billing_email": order.user.email or '',
        "billing_phone": getattr(order.user, 'phone', '') or str(getattr(addr, 'phone', '')),
        "shipping_is_billing": True,
        "order_items": items_payload,
        "payment_method": "Prepaid" if order.is_paid else "COD",
        "sub_total": str(order.total_amount),
        "length": 20,  # Default package dimensions (cm)
        "breadth": 15,
        "height": 10,
        "weight": float(order.shipment.weight_kg) if hasattr(order, 'shipment') and order.shipment else 0.5,
    }

    url = f"{SHIPROCKET_BASE_URL}/orders/create/adhoc"

    try:
        response = requests.post(url, json=payload, headers=_get_headers(), timeout=30)
        response.raise_for_status()
        data = response.json()

        result = {
            'shiprocket_order_id': str(data.get('order_id', '')),
            'shiprocket_shipment_id': str(data.get('shipment_id', '')),
            'awb_code': data.get('awb_code', ''),
            'courier_name': data.get('courier_name', ''),
            'status': data.get('status', ''),
            'label_url': data.get('label_url', ''),
            'raw_response': data,
        }

        logger.info(f"Shiprocket order created for Order #{order.id}: {result['shiprocket_order_id']}")
        return result

    except requests.RequestException as e:
        logger.error(f"Shiprocket create order failed for Order #{order.id}: {e}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"Response body: {e.response.text}")
        raise


# =============================================================================
# Generate AWB (if not auto-assigned)
# =============================================================================

def generate_awb(shiprocket_shipment_id, courier_id=None):
    """
    Request AWB (tracking number) assignment for a shipment.
    Shiprocket may auto-assign, but this endpoint explicitly requests it.

    Args:
        shiprocket_shipment_id: Shiprocket shipment ID
        courier_id: Optional specific courier partner ID

    Returns:
        dict with awb_code, courier info
    """
    url = f"{SHIPROCKET_BASE_URL}/courier/assign/awb"
    payload = {"shipment_id": shiprocket_shipment_id}
    if courier_id:
        payload['courier_id'] = courier_id

    try:
        response = requests.post(url, json=payload, headers=_get_headers(), timeout=15)
        response.raise_for_status()
        data = response.json()

        awb_data = data.get('response', {}).get('data', {})
        return {
            'awb_code': awb_data.get('awb_code', ''),
            'courier_name': awb_data.get('courier_name', ''),
            'courier_company_id': awb_data.get('courier_company_id', ''),
        }
    except requests.RequestException as e:
        logger.error(f"Shiprocket AWB generation failed for shipment {shiprocket_shipment_id}: {e}")
        raise


# =============================================================================
# Track Shipment
# =============================================================================

def track_shipment_by_awb(awb_code):
    """
    Track a shipment using its AWB (Air Waybill) code.

    Args:
        awb_code: The tracking/AWB number

    Returns:
        dict with current_status, tracking_data (list of scan events), etd
    """
    url = f"{SHIPROCKET_BASE_URL}/courier/track/awb/{awb_code}"

    try:
        response = requests.get(url, headers=_get_headers(), timeout=15)
        response.raise_for_status()
        data = response.json()

        tracking_data = data.get('tracking_data', {})
        shipment_track = tracking_data.get('shipment_track', [])

        # Parse scan activities
        activities = []
        if shipment_track:
            for track_group in shipment_track:
                for activity in track_group.get('tracking_data', []):
                    activities.append({
                        'status': activity.get('activity', ''),
                        'status_code': activity.get('sr-status-label', ''),
                        'description': activity.get('activity', ''),
                        'location': activity.get('location', ''),
                        'event_time': activity.get('date', ''),
                    })

        current_status = tracking_data.get('shipment_status', '')
        etd = tracking_data.get('etd', '')

        return {
            'current_status': current_status,
            'etd': etd,
            'activities': activities,
            'raw_data': data,
        }

    except requests.RequestException as e:
        logger.error(f"Shiprocket tracking failed for AWB {awb_code}: {e}")
        raise


def track_shipment_by_order_id(shiprocket_order_id):
    """
    Track a shipment using the Shiprocket order ID.

    Args:
        shiprocket_order_id: The Shiprocket order ID

    Returns:
        Same structure as track_shipment_by_awb
    """
    url = f"{SHIPROCKET_BASE_URL}/courier/track"
    params = {"order_id": shiprocket_order_id}

    try:
        response = requests.get(url, params=params, headers=_get_headers(), timeout=15)
        response.raise_for_status()
        data = response.json()

        # Shiprocket returns tracking_data under different keys depending on the endpoint
        if isinstance(data, list) and len(data) > 0:
            tracking_info = data[0]
        else:
            tracking_info = data

        return {
            'current_status': tracking_info.get('status', ''),
            'activities': tracking_info.get('tracking_data', []),
            'raw_data': data,
        }

    except requests.RequestException as e:
        logger.error(f"Shiprocket tracking failed for order {shiprocket_order_id}: {e}")
        raise


# =============================================================================
# Cancel Order
# =============================================================================

def cancel_shiprocket_order(shiprocket_order_ids):
    """
    Cancel one or more orders in Shiprocket.

    Args:
        shiprocket_order_ids: list of Shiprocket order IDs to cancel

    Returns:
        API response dict
    """
    if isinstance(shiprocket_order_ids, (str, int)):
        shiprocket_order_ids = [shiprocket_order_ids]

    url = f"{SHIPROCKET_BASE_URL}/orders/cancel"
    payload = {"ids": shiprocket_order_ids}

    try:
        response = requests.post(url, json=payload, headers=_get_headers(), timeout=15)
        response.raise_for_status()
        data = response.json()
        logger.info(f"Shiprocket orders cancelled: {shiprocket_order_ids}")
        return data
    except requests.RequestException as e:
        logger.error(f"Shiprocket cancel failed for orders {shiprocket_order_ids}: {e}")
        raise


# =============================================================================
# Schedule Pickup
# =============================================================================

def schedule_pickup(shiprocket_shipment_id):
    """
    Request a courier pickup for a shipment.

    Args:
        shiprocket_shipment_id: Shiprocket shipment ID

    Returns:
        dict with pickup status
    """
    url = f"{SHIPROCKET_BASE_URL}/courier/generate/pickup"
    payload = {"shipment_id": [shiprocket_shipment_id]}

    try:
        response = requests.post(url, json=payload, headers=_get_headers(), timeout=15)
        response.raise_for_status()
        data = response.json()
        logger.info(f"Pickup scheduled for shipment {shiprocket_shipment_id}")
        return data
    except requests.RequestException as e:
        logger.error(f"Shiprocket pickup scheduling failed for shipment {shiprocket_shipment_id}: {e}")
        raise


# =============================================================================
# Generate Label & Manifest
# =============================================================================

def generate_label(shiprocket_shipment_id):
    """Generate shipping label for a shipment."""
    url = f"{SHIPROCKET_BASE_URL}/courier/generate/label"
    payload = {"shipment_id": [shiprocket_shipment_id]}

    try:
        response = requests.post(url, json=payload, headers=_get_headers(), timeout=15)
        response.raise_for_status()
        data = response.json()
        return data.get('label_url', '')
    except requests.RequestException as e:
        logger.error(f"Label generation failed for shipment {shiprocket_shipment_id}: {e}")
        raise


# =============================================================================
# Webhook Payload Parser
# =============================================================================

STATUS_MAP = {
    # Shiprocket status -> our Shipment.STATUS_CHOICES value
    'NEW': 'label_created',
    'PICKUP SCHEDULED': 'pickup_scheduled',
    'PICKED UP': 'picked_up',
    'IN TRANSIT': 'in_transit',
    'OUT FOR DELIVERY': 'out_for_delivery',
    'DELIVERED': 'delivered',
    'RTO INITIATED': 'rto_initiated',
    'RTO DELIVERED': 'rto_delivered',
    'CANCELED': 'cancelled',
    'CANCELLED': 'cancelled',
    'LOST': 'lost',
    # Additional Shiprocket statuses
    'SHIPPED': 'in_transit',
    'UNDELIVERED': 'in_transit',
    'PENDING': 'label_created',
}


def parse_webhook_payload(payload):
    """
    Parse a Shiprocket webhook payload and extract tracking information.

    Shiprocket sends POST webhooks to configured URL with tracking updates.

    Args:
        payload: dict from webhook POST body

    Returns:
        dict with: awb_code, order_id, current_status, status_mapped,
                   courier_name, event_time, location, etd, scans
    """
    awb = payload.get('awb', '') or payload.get('awb_code', '')
    order_id = payload.get('order_id', '')
    sr_status = (payload.get('current_status', '') or payload.get('status', '')).upper()
    courier_name = payload.get('courier_name', '')
    etd = payload.get('etd', '')
    location = payload.get('current_city', '') or payload.get('location', '')
    event_time_str = payload.get('current_timestamp', '') or payload.get('timestamp', '')

    # Parse event time
    event_time = None
    if event_time_str:
        for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M'):
            try:
                event_time = datetime.strptime(event_time_str, fmt)
                event_time = timezone.make_aware(event_time)
                break
            except (ValueError, TypeError):
                continue

    # Map Shiprocket status to our model status
    mapped_status = STATUS_MAP.get(sr_status, 'in_transit')

    # Parse individual scan activities if present
    scans = []
    for scan in payload.get('scans', []):
        scan_time_str = scan.get('date', '') or scan.get('time', '')
        scan_time = None
        if scan_time_str:
            for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M'):
                try:
                    scan_time = datetime.strptime(scan_time_str, fmt)
                    scan_time = timezone.make_aware(scan_time)
                    break
                except (ValueError, TypeError):
                    continue

        scans.append({
            'status': scan.get('activity', scan.get('status', '')),
            'status_code': scan.get('sr-status-label', ''),
            'location': scan.get('location', ''),
            'event_time': scan_time or timezone.now(),
        })

    return {
        'awb_code': awb,
        'shiprocket_order_id': str(order_id),
        'current_status': sr_status,
        'status_mapped': mapped_status,
        'courier_name': courier_name,
        'etd': etd,
        'location': location,
        'event_time': event_time or timezone.now(),
        'scans': scans,
        'raw_data': payload,
    }


def process_tracking_webhook(payload):
    """
    Process a Shiprocket tracking webhook and update local Shipment + tracking events.

    Args:
        payload: raw webhook POST body (dict)

    Returns:
        dict with status and message
    """
    from .models import Shipment, ShipmentTrackingEvent

    parsed = parse_webhook_payload(payload)
    awb_code = parsed['awb_code']
    shiprocket_order_id = parsed['shiprocket_order_id']

    # Find shipment by AWB code or Shiprocket order ID
    shipment = None
    if awb_code:
        shipment = Shipment.objects.filter(awb_code=awb_code).first()
    if not shipment and shiprocket_order_id:
        shipment = Shipment.objects.filter(shiprocket_order_id=shiprocket_order_id).first()

    if not shipment:
        logger.warning(
            f"Shiprocket webhook: No shipment found for AWB={awb_code}, "
            f"order_id={shiprocket_order_id}"
        )
        return {'status': 'ignored', 'message': 'Shipment not found'}

    # Update shipment status
    old_status = shipment.status
    shipment.status = parsed['status_mapped']
    if parsed['courier_name']:
        shipment.courier_name = parsed['courier_name']

    # Mark delivered
    if parsed['status_mapped'] == 'delivered' and not shipment.delivered_at:
        shipment.delivered_at = timezone.now()
        # Also transition the Order to Delivered
        order = shipment.order
        if order.can_transition_to('Delivered'):
            order.transition_status('Delivered', note='Auto-delivered via Shiprocket webhook')

    shipment.save()

    # Create tracking event for the main status update
    ShipmentTrackingEvent.objects.create(
        shipment=shipment,
        status=parsed['current_status'],
        status_code=parsed['status_mapped'],
        description=f"Status updated: {parsed['current_status']}",
        location=parsed['location'],
        event_time=parsed['event_time'],
        raw_data=parsed['raw_data'],
    )

    # Create tracking events for individual scans
    for scan in parsed['scans']:
        ShipmentTrackingEvent.objects.get_or_create(
            shipment=shipment,
            event_time=scan['event_time'],
            status=scan['status'],
            defaults={
                'status_code': scan['status_code'],
                'location': scan['location'],
            }
        )

    logger.info(
        f"Shiprocket webhook processed: Shipment #{shipment.id} "
        f"{old_status} → {parsed['status_mapped']}"
    )

    return {
        'status': 'processed',
        'shipment_id': shipment.id,
        'old_status': old_status,
        'new_status': parsed['status_mapped'],
    }
