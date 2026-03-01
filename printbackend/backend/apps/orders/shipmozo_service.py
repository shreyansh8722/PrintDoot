"""
Shipmozo (shipping-api.com) Integration Service
================================================
Handles:
- Pincode serviceability checks
- Shipping rate calculation
- Pushing orders to Shipmozo
- Auto-assigning couriers
- Order tracking (by AWB)
- Order cancellation
- Shipping label generation
- Warehouse management

API Docs: https://shipping-api.com/api/v1/api-docs-v1.json
Base URL: https://shipping-api.com/app/api/v1
Auth: public-key + private-key headers
"""

import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

BASE_URL = 'https://shipping-api.com/app/api/v1'


# =============================================================================
# Auth Headers
# =============================================================================

def _get_headers():
    """Return auth headers for Shipmozo API calls."""
    return {
        'public-key': settings.SHIPMOZO_PUBLIC_KEY,
        'private-key': settings.SHIPMOZO_PRIVATE_KEY,
        'Content-Type': 'application/json',
    }


# =============================================================================
# Utility — Pincode Serviceability
# =============================================================================

def check_serviceability(pickup_pincode, delivery_pincode):
    """
    Check if delivery is possible between two pincodes.

    Args:
        pickup_pincode: Origin/warehouse pincode (e.g., '413512')
        delivery_pincode: Customer's delivery pincode

    Returns:
        dict: { 'serviceable': True/False, ... }
    """
    try:
        response = requests.post(
            f'{BASE_URL}/pincode-serviceability',
            headers=_get_headers(),
            json={
                'pickup_pincode': str(pickup_pincode),
                'delivery_pincode': str(delivery_pincode),
            },
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()

        if data.get('result') == '1':
            return {
                'serviceable': data.get('data', {}).get('serviceable', False),
                'message': data.get('message', 'Success'),
                'raw': data.get('data', {}),
            }
        else:
            return {
                'serviceable': False,
                'message': data.get('message', 'Not serviceable'),
                'raw': data,
            }
    except requests.RequestException as e:
        logger.error(f'Shipmozo serviceability check failed: {e}')
        return {
            'serviceable': False,
            'message': str(e),
            'error': True,
        }


# =============================================================================
# Shipping Rate Calculator
# =============================================================================

def calculate_rates(*, pickup_pincode, delivery_pincode, weight_grams,
                    order_amount, payment_type='PREPAID',
                    length=20, width=15, height=10):
    """
    Calculate shipping rates from Shipmozo for a given shipment.

    Args:
        pickup_pincode: Warehouse/origin pincode
        delivery_pincode: Customer's pincode
        weight_grams: Total package weight in grams
        order_amount: Order total (for COD/insurance)
        payment_type: 'PREPAID' or 'COD'
        length/width/height: Package dimensions in cm

    Returns:
        list of rate options from Shipmozo, sorted cheapest first.
        Each option has: courier_name, rate, etd, etc.
    """
    try:
        response = requests.post(
            f'{BASE_URL}/rate-calculator',
            headers=_get_headers(),
            json={
                'pickup_pincode': str(pickup_pincode),
                'delivery_pincode': str(delivery_pincode),
                'payment_type': payment_type,
                'shipment_type': 'FORWARD',
                'order_amount': str(order_amount),
                'type_of_package': 'SPS',
                'rov_type': 'ROV_OWNER',
                'cod_amount': str(order_amount) if payment_type == 'COD' else '',
                'weight': str(weight_grams),
                'dimensions': [
                    {
                        'no_of_box': '1',
                        'length': str(length),
                        'width': str(width),
                        'height': str(height),
                    }
                ],
            },
            timeout=15,
        )
        response.raise_for_status()
        data = response.json()

        if data.get('result') == '1':
            rates = data.get('data', [])
            # Normalize and sort by rate
            normalized = []
            if isinstance(rates, list):
                for r in rates:
                    normalized.append({
                        'courier_id': r.get('id'),
                        'courier_name': r.get('name', 'Unknown'),
                        'courier_image': r.get('image', ''),
                        'rate': float(r.get('total_charges', 0)),
                        'shipping_charges': float(r.get('shipping_charges', 0)),
                        'gst': float(r.get('gst', 0)),
                        'etd': r.get('estimated_delivery', 'N/A'),
                        'cod_charges': float(r.get('overhead_charges', 0)),
                        'min_weight': r.get('minimum_chargeable_weight', ''),
                        'from_zone': r.get('from_zone', ''),
                        'to_zone': r.get('to_zone', ''),
                        'raw': r,
                    })
                normalized.sort(key=lambda x: x['rate'])

            return {
                'success': True,
                'rates': normalized,
                'message': data.get('message', 'Success'),
            }
        else:
            logger.warning(f'Shipmozo rate calculator failed: {data}')
            return {
                'success': False,
                'rates': [],
                'message': data.get('message', 'Rate calculation failed'),
            }
    except requests.RequestException as e:
        logger.error(f'Shipmozo rate calculation error: {e}')
        return {
            'success': False,
            'rates': [],
            'message': str(e),
            'error': True,
        }


# =============================================================================
# Push Order
# =============================================================================

def push_order(order):
    """
    Push a paid order to Shipmozo for fulfillment.

    Args:
        order: Order model instance (must have shipping address, items, etc.)

    Returns:
        dict with order_id, reference_id from Shipmozo
    """
    import re

    def _sanitize(value, max_len=255):
        """Strip dangerous characters and limit length."""
        if not value:
            return ''
        # Remove any potential injection characters
        val = re.sub(r'[<>{};\\\'"&]', '', str(value).strip())
        return val[:max_len]

    # Get shipping address
    shipping_address = order.shipping_address
    if not shipping_address:
        return {'success': False, 'message': 'No shipping address on order'}

    # Build product_detail array from order items
    product_details = []
    total_weight = 0
    for item in order.items.select_related('product').all():
        product = item.product
        if product:
            product_details.append({
                'name': _sanitize(product.name, 100),
                'sku_number': _sanitize(product.sku or str(product.id), 50),
                'quantity': item.quantity,
                'discount': '',
                'hsn': '',
                'unit_price': float(item.unit_price),
                'product_category': 'Other',
            })
            total_weight += (product.weight_grams or 200) * item.quantity

    if total_weight < 1:
        total_weight = 200  # Minimum fallback

    try:
        payload = {
            'order_id': str(order.id),
            'order_date': order.created_at.strftime('%Y-%m-%d'),
            'consignee_name': _sanitize(
                shipping_address.recipient_name
                or order.user.get_full_name()
                or order.user.username,
                100
            ),
            'consignee_phone': _sanitize(shipping_address.phone_number, 15),
            'consignee_alternate_phone': '',
            'consignee_email': _sanitize(order.user.email, 100),
            'consignee_address_line_one': _sanitize(shipping_address.street, 200),
            'consignee_address_line_two': _sanitize(shipping_address.apartment_suite, 200),
            'consignee_pin_code': _sanitize(shipping_address.zip_code, 10),
            'consignee_city': _sanitize(shipping_address.city, 100),
            'consignee_state': _sanitize(shipping_address.state, 100),
            'product_detail': product_details,
            'payment_type': 'COD' if order.payment_method == 'cod' else 'PREPAID',
            'cod_amount': str(order.total_amount) if order.payment_method == 'cod' else '',
            'shipping_charges': str(order.shipping_total) if order.shipping_total else '',
            'weight': str(total_weight),
            'length': '20',
            'width': '15',
            'height': '10',
            'warehouse_id': '',
            'gst_ewaybill_number': '',
            'gstin_number': '',
        }

        response = requests.post(
            f'{BASE_URL}/push-order',
            headers=_get_headers(),
            json=payload,
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()

        if data.get('result') == '1':
            shipmozo_data = data.get('data', {})
            logger.info(f"Shipmozo order pushed: order={order.id}, "
                        f"shipmozo_order_id={shipmozo_data.get('order_id')}, "
                        f"ref={shipmozo_data.get('refrence_id')}")
            return {
                'success': True,
                'shipmozo_order_id': shipmozo_data.get('order_id'),
                'reference_id': shipmozo_data.get('refrence_id'),
                'message': shipmozo_data.get('Info', 'Order pushed successfully'),
            }
        else:
            logger.error(f"Shipmozo push order failed: {data}")
            return {
                'success': False,
                'message': data.get('message', 'Failed to push order'),
                'raw': data,
            }
    except requests.RequestException as e:
        logger.error(f'Shipmozo push order error: {e}')
        return {'success': False, 'message': str(e), 'error': True}


# =============================================================================
# Auto Assign Courier (+ AWB)
# =============================================================================

def auto_assign_courier(order_id):
    """
    Auto-assign the best courier and generate AWB for an order.

    Args:
        order_id: The order_id used when pushing to Shipmozo

    Returns:
        dict with awb_number, courier_company, courier_service
    """
    try:
        response = requests.post(
            f'{BASE_URL}/auto-assign-order',
            headers=_get_headers(),
            json={'order_id': str(order_id)},
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()

        if data.get('result') == '1':
            assign_data = data.get('data', {})
            logger.info(f"Shipmozo auto-assign: order={order_id}, "
                        f"awb={assign_data.get('awb_number')}, "
                        f"courier={assign_data.get('courier_company')}")
            return {
                'success': True,
                'order_id': assign_data.get('order_id'),
                'reference_id': assign_data.get('refrence_id'),
                'awb_number': assign_data.get('awb_number'),
                'courier_company': assign_data.get('courier_company', ''),
                'courier_service': assign_data.get('courier_company_service', ''),
            }
        else:
            return {
                'success': False,
                'message': data.get('message', 'Auto-assign failed'),
                'raw': data,
            }
    except requests.RequestException as e:
        logger.error(f'Shipmozo auto-assign error: {e}')
        return {'success': False, 'message': str(e), 'error': True}


# =============================================================================
# Assign Specific Courier
# =============================================================================

def assign_courier(order_id, courier_id):
    """
    Assign a specific courier to an order.

    Args:
        order_id: Shipmozo order ID
        courier_id: Courier ID from rate calculator

    Returns:
        dict with assignment result
    """
    try:
        response = requests.post(
            f'{BASE_URL}/assign-courier',
            headers=_get_headers(),
            json={
                'order_id': str(order_id),
                'courier_id': str(courier_id),
            },
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()

        if data.get('result') == '1':
            assign_data = data.get('data', {})
            return {
                'success': True,
                'order_id': assign_data.get('order_id'),
                'courier': assign_data.get('courier', ''),
            }
        else:
            return {'success': False, 'message': data.get('message', 'Assign failed')}
    except requests.RequestException as e:
        logger.error(f'Shipmozo assign courier error: {e}')
        return {'success': False, 'message': str(e), 'error': True}


# =============================================================================
# Schedule Pickup
# =============================================================================

def schedule_pickup(order_id):
    """
    Schedule a pickup for an order.

    Returns:
        dict with awb_number, courier, lr_number
    """
    try:
        response = requests.post(
            f'{BASE_URL}/schedule-pickup',
            headers=_get_headers(),
            json={'order_id': str(order_id)},
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()

        if data.get('result') == '1':
            pickup_data = data.get('data', {})
            return {
                'success': True,
                'order_id': pickup_data.get('order_id'),
                'awb_number': pickup_data.get('awb_number'),
                'courier': pickup_data.get('courier', ''),
                'lr_number': pickup_data.get('lr_number', ''),
            }
        else:
            return {'success': False, 'message': data.get('message', 'Pickup scheduling failed')}
    except requests.RequestException as e:
        logger.error(f'Shipmozo schedule pickup error: {e}')
        return {'success': False, 'message': str(e), 'error': True}


# =============================================================================
# Track Order
# =============================================================================

def track_order(awb_number):
    """
    Track a shipment by AWB number.

    Args:
        awb_number: The Air Waybill tracking number

    Returns:
        dict with tracking status and events
    """
    try:
        response = requests.get(
            f'{BASE_URL}/track-order',
            headers=_get_headers(),
            params={'awb_number': str(awb_number)},
            timeout=15,
        )
        response.raise_for_status()
        data = response.json()

        if data.get('result') == '1':
            return {
                'success': True,
                'tracking_data': data.get('data', {}),
                'message': data.get('message', 'Success'),
            }
        else:
            return {
                'success': False,
                'tracking_data': {},
                'message': data.get('message', 'Tracking failed'),
            }
    except requests.RequestException as e:
        logger.error(f'Shipmozo tracking error: {e}')
        return {'success': False, 'tracking_data': {}, 'message': str(e), 'error': True}


# =============================================================================
# Get Order Detail
# =============================================================================

def get_order_detail(order_id):
    """
    Get full order details from Shipmozo.

    Args:
        order_id: The Shipmozo order ID

    Returns:
        dict with order details
    """
    import re
    # Sanitize order_id to prevent path traversal
    safe_id = re.sub(r'[^a-zA-Z0-9_-]', '', str(order_id))
    if not safe_id:
        return {'success': False, 'message': 'Invalid order ID'}

    try:
        response = requests.get(
            f'{BASE_URL}/get-order-detail/{safe_id}',
            headers=_get_headers(),
            timeout=15,
        )
        response.raise_for_status()
        data = response.json()

        if data.get('result') == '1':
            return {'success': True, 'data': data.get('data', {})}
        else:
            return {'success': False, 'message': data.get('message', 'Failed')}
    except requests.RequestException as e:
        logger.error(f'Shipmozo get order detail error: {e}')
        return {'success': False, 'message': str(e), 'error': True}


# =============================================================================
# Cancel Order
# =============================================================================

def cancel_order(order_id, awb_number=''):
    """
    Cancel a Shipmozo order.

    Args:
        order_id: Shipmozo order ID
        awb_number: AWB number (if assigned)

    Returns:
        dict with cancellation result
    """
    try:
        payload = {'order_id': str(order_id)}
        if awb_number:
            payload['awb_number'] = str(awb_number)

        response = requests.post(
            f'{BASE_URL}/cancel-order',
            headers=_get_headers(),
            json=payload,
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()

        if data.get('result') == '1':
            logger.info(f"Shipmozo order cancelled: {order_id}")
            return {
                'success': True,
                'order_id': data.get('data', {}).get('order_id'),
                'reference_id': data.get('data', {}).get('refrence_id'),
                'message': 'Order cancelled successfully',
            }
        else:
            return {'success': False, 'message': data.get('message', 'Cancellation failed')}
    except requests.RequestException as e:
        logger.error(f'Shipmozo cancel order error: {e}')
        return {'success': False, 'message': str(e), 'error': True}


# =============================================================================
# Get Shipping Label
# =============================================================================

def get_order_label(awb_number, label_type='PDF'):
    """
    Get the shipping label for an order.

    Args:
        awb_number: AWB number
        label_type: 'PDF' for PDF label

    Returns:
        dict with label URL or data
    """
    import re
    # Sanitize AWB number to prevent path traversal
    safe_awb = re.sub(r'[^a-zA-Z0-9_-]', '', str(awb_number))
    if not safe_awb:
        return {'success': False, 'message': 'Invalid AWB number'}

    try:
        params = {}
        if label_type:
            params['type_of_label'] = label_type

        response = requests.get(
            f'{BASE_URL}/get-order-label/{safe_awb}',
            headers=_get_headers(),
            params=params,
            timeout=15,
        )
        response.raise_for_status()
        data = response.json()

        if data.get('result') == '1':
            return {'success': True, 'data': data.get('data', {})}
        else:
            return {'success': False, 'message': data.get('message', 'Label generation failed')}
    except requests.RequestException as e:
        logger.error(f'Shipmozo get label error: {e}')
        return {'success': False, 'message': str(e), 'error': True}


# =============================================================================
# Warehouses
# =============================================================================

def get_warehouses(page=1):
    """
    Get all configured warehouses from Shipmozo.

    Returns:
        dict with warehouse list
    """
    try:
        response = requests.get(
            f'{BASE_URL}/get-warehouses',
            headers=_get_headers(),
            params={'page': str(page)},
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()

        if data.get('result') == '1':
            return {'success': True, 'warehouses': data.get('data', [])}
        else:
            return {'success': False, 'message': data.get('message', 'Failed')}
    except requests.RequestException as e:
        logger.error(f'Shipmozo get warehouses error: {e}')
        return {'success': False, 'message': str(e), 'error': True}


# =============================================================================
# Push Return Order
# =============================================================================

def push_return_order(*, order_id, order_date, pickup_name, pickup_phone,
                      pickup_email, pickup_address_line_one, pickup_address_line_two,
                      pickup_pin_code, pickup_city, pickup_state,
                      product_details, weight_grams, return_reason_id='',
                      customer_request='REFUND', reason_comment='',
                      length=20, width=15, height=10):
    """
    Push a return order to Shipmozo for reverse pickup.

    Returns:
        dict with order push result
    """
    try:
        payload = {
            'order_id': str(order_id),
            'order_date': order_date,
            'pickup_name': pickup_name,
            'pickup_phone': str(pickup_phone),
            'pickup_email': pickup_email,
            'pickup_address_line_one': pickup_address_line_one,
            'pickup_address_line_two': pickup_address_line_two,
            'pickup_pin_code': str(pickup_pin_code),
            'pickup_city': pickup_city,
            'pickup_state': pickup_state,
            'product_detail': product_details,
            'payment_type': 'PREPAID',
            'weight': str(weight_grams),
            'length': str(length),
            'width': str(width),
            'height': str(height),
            'warehouse_id': '',
            'return_reason_id': str(return_reason_id),
            'customer_request': customer_request,
            'reason_comment': reason_comment,
        }

        response = requests.post(
            f'{BASE_URL}/push-return-order',
            headers=_get_headers(),
            json=payload,
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()

        if data.get('result') == '1':
            return {
                'success': True,
                'order_id': data.get('data', {}).get('order_id'),
                'reference_id': data.get('data', {}).get('refrence_id'),
                'message': 'Return order pushed successfully',
            }
        else:
            return {'success': False, 'message': data.get('message', 'Return push failed')}
    except requests.RequestException as e:
        logger.error(f'Shipmozo push return order error: {e}')
        return {'success': False, 'message': str(e), 'error': True}


# =============================================================================
# Generate Manifest
# =============================================================================

def generate_manifest(awb_numbers):
    """
    Generate a manifest for multiple AWB numbers.

    Args:
        awb_numbers: list of AWB numbers (max 25)

    Returns:
        dict with manifest data
    """
    try:
        awb_str = ','.join(str(a) for a in awb_numbers[:25])
        response = requests.get(
            f'{BASE_URL}/generate-manifest',
            headers=_get_headers(),
            params={'awb_numbers': awb_str},
            timeout=15,
        )
        response.raise_for_status()
        data = response.json()

        if data.get('result') == '1':
            return {'success': True, 'data': data.get('data', {})}
        else:
            return {'success': False, 'message': data.get('message', 'Manifest failed')}
    except requests.RequestException as e:
        logger.error(f'Shipmozo generate manifest error: {e}')
        return {'success': False, 'message': str(e), 'error': True}
