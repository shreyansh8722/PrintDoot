"""
Shipping Cost Calculator — Shipmozo Integration
=================================================
Uses the Shipmozo API for:
  - Pincode serviceability checks
  - Live shipping rate calculations from courier partners
  - Fallback to local defaults if the API is unreachable

Also provides helper utilities for calculating order weight.
"""

from decimal import Decimal, ROUND_HALF_UP
from . import shipmozo_service
from django.conf import settings

# ─── CONFIG ───────────────────────────────────────────────────────────────

PICKUP_PINCODE = getattr(settings, 'STORE_PINCODE', '413512')

# ─── FALLBACK DEFAULT RATES (used when Shipmozo API is down) ─────────────

DEFAULT_RATES = {
    'standard': {
        'base_rate': Decimal('99.00'),
        'per_kg_rate': Decimal('30.00'),
        'base_weight_grams': 500,
        'free_above': Decimal('999.00'),
        'min_days': 5,
        'max_days': 7,
    },
    'express': {
        'base_rate': Decimal('199.00'),
        'per_kg_rate': Decimal('50.00'),
        'base_weight_grams': 500,
        'free_above': None,
        'min_days': 2,
        'max_days': 3,
    },
    'priority': {
        'base_rate': Decimal('399.00'),
        'per_kg_rate': Decimal('80.00'),
        'base_weight_grams': 500,
        'free_above': None,
        'min_days': 1,
        'max_days': 1,
    },
}

SHIPPING_METHOD_LABELS = {
    'standard': 'Standard Delivery',
    'express': 'Express Delivery',
    'priority': 'Priority Delivery',
}


# ─── PUBLIC API ───────────────────────────────────────────────────────────

def check_serviceability(pincode: str) -> dict:
    """
    Check if a pincode is serviceable via Shipmozo.
    Falls back to accepting all pincodes if API is unreachable.

    Returns:
    {
        'serviceable': True/False,
        'pincode': '400001',
        'city': '',
        'state': '',
        'zone': 'Shipmozo',
        'available_methods': ['standard', 'express', 'priority'],
        'cod_available': True,
    }
    """
    pincode = str(pincode).strip()

    # Call Shipmozo API
    result = shipmozo_service.check_serviceability(
        pickup_pincode=PICKUP_PINCODE,
        delivery_pincode=pincode,
    )

    if result.get('serviceable'):
        return {
            'serviceable': True,
            'pincode': pincode,
            'city': result.get('raw', {}).get('city', ''),
            'state': result.get('raw', {}).get('state', ''),
            'zone': 'Shipmozo',
            'available_methods': ['standard', 'express', 'priority'],
            'cod_available': True,
        }
    else:
        # Shipmozo's serviceability API can return False even when rates work.
        # Default to serviceable — the rate calculator will handle the real check.
        # If rates also fail, calculate_shipping() falls back to default rates.
        return {
            'serviceable': True,
            'pincode': pincode,
            'city': '',
            'state': '',
            'zone': 'Default',
            'available_methods': ['standard', 'express', 'priority'],
            'cod_available': True,
        }


def calculate_shipping(*, pincode: str, weight_grams: int, order_subtotal: Decimal,
                       method: str = 'standard') -> dict:
    """
    Calculate shipping cost using Shipmozo live rates, with local fallback.

    Args:
        pincode:        Destination pincode
        weight_grams:   Total order weight in grams
        order_subtotal: Cart subtotal in ₹ (used for free-shipping threshold)
        method:         'standard' | 'express' | 'priority'

    Returns:
    {
        'method': 'standard',
        'method_label': 'Standard Delivery',
        'cost': Decimal('99.00'),
        'is_free': False,
        'free_above': Decimal('999.00'),
        'eta_min_days': 5,
        'eta_max_days': 7,
        'weight_grams': 450,
        'zone': 'Shipmozo',
        'courier_name': 'Delhivery',
    }
    """
    if method not in DEFAULT_RATES:
        raise ValueError(f"Invalid shipping method: {method}. Choose from: standard, express, priority")

    pincode = str(pincode).strip()

    # Try Shipmozo live rates
    rate_result = shipmozo_service.calculate_rates(
        pickup_pincode=PICKUP_PINCODE,
        delivery_pincode=pincode,
        weight_grams=weight_grams,
        order_amount=float(order_subtotal),
        payment_type='PREPAID',
    )

    if rate_result.get('success') and rate_result.get('rates'):
        rates = rate_result['rates']

        # Map method to rate index: standard=cheapest, express=mid, priority=fastest/most expensive
        if method == 'standard':
            selected = rates[0]  # Cheapest
        elif method == 'express':
            selected = rates[len(rates) // 2] if len(rates) > 1 else rates[0]
        elif method == 'priority':
            selected = rates[-1]  # Most expensive (fastest)
        else:
            selected = rates[0]

        cost = Decimal(str(selected['rate'])).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        # Apply free-shipping threshold for standard
        defaults = DEFAULT_RATES.get(method, {})
        free_above = defaults.get('free_above')
        is_free = False
        if free_above and order_subtotal >= free_above:
            cost = Decimal('0.00')
            is_free = True

        # Parse ETD
        etd = selected.get('etd', '')
        try:
            etd_days = int(str(etd).split('-')[0].strip()) if etd else defaults.get('min_days', 5)
        except (ValueError, IndexError):
            etd_days = defaults.get('min_days', 5)

        try:
            etd_max = int(str(etd).split('-')[-1].strip()) if '-' in str(etd) else etd_days + 2
        except (ValueError, IndexError):
            etd_max = etd_days + 2

        return {
            'method': method,
            'method_label': SHIPPING_METHOD_LABELS.get(method, method),
            'cost': cost,
            'is_free': is_free,
            'free_above': free_above,
            'eta_min_days': etd_days,
            'eta_max_days': etd_max,
            'weight_grams': weight_grams,
            'zone': 'Shipmozo',
            'courier_name': selected.get('courier_name', ''),
            'courier_id': selected.get('courier_id'),
            'all_rates': rates,
        }

    # ─── FALLBACK to hardcoded defaults if Shipmozo is unreachable ────────
    defaults = DEFAULT_RATES[method]
    cost = _compute_cost(
        base_rate=defaults['base_rate'],
        per_kg_rate=defaults['per_kg_rate'],
        base_weight_grams=defaults['base_weight_grams'],
        weight_grams=weight_grams,
    )
    free_above = defaults['free_above']
    if free_above and order_subtotal >= free_above:
        cost = Decimal('0.00')
        is_free = True
    else:
        is_free = (cost == Decimal('0.00'))

    return {
        'method': method,
        'method_label': SHIPPING_METHOD_LABELS.get(method, method),
        'cost': cost,
        'is_free': is_free,
        'free_above': free_above,
        'eta_min_days': defaults['min_days'],
        'eta_max_days': defaults['max_days'],
        'weight_grams': weight_grams,
        'zone': 'Default (Shipmozo unavailable)',
    }


def calculate_all_shipping_options(*, pincode: str, weight_grams: int,
                                    order_subtotal: Decimal) -> list:
    """
    Calculate shipping costs for ALL available methods at a given pincode.
    Uses Shipmozo live rates, returns list sorted cheapest first.
    """
    serviceability = check_serviceability(pincode)
    if not serviceability.get('serviceable'):
        return []

    available = serviceability.get('available_methods', ['standard', 'express'])

    results = []
    for method in available:
        try:
            result = calculate_shipping(
                pincode=pincode,
                weight_grams=weight_grams,
                order_subtotal=order_subtotal,
                method=method,
            )
            result['cod_available'] = serviceability.get('cod_available', True)
            results.append(result)
        except Exception:
            continue

    results.sort(key=lambda x: x['cost'])
    return results


def calculate_order_weight(items_data: list) -> int:
    """
    Calculate total weight in grams for a list of cart items.
    Each item should have a 'product' (or 'product_id') and 'quantity'.
    """
    from apps.catalog.models import Product

    total_weight = 0
    for item in items_data:
        product = item.get('product')
        quantity = item.get('quantity', 1)
        if product:
            if isinstance(product, int):
                try:
                    product = Product.objects.get(id=product)
                except Product.DoesNotExist:
                    continue
            weight = getattr(product, 'weight_grams', 200) or 200
            total_weight += weight * quantity
        else:
            # Default fallback weight
            total_weight += 200 * quantity

    return total_weight


# ─── INTERNAL HELPERS ─────────────────────────────────────────────────────

def _compute_cost(*, base_rate: Decimal, per_kg_rate: Decimal,
                  base_weight_grams: int, weight_grams: int) -> Decimal:
    """
    Compute shipping cost with base + per-kg overage.
    Only used as fallback when Shipmozo API is unavailable.
    """
    if weight_grams <= base_weight_grams:
        return base_rate

    extra_grams = weight_grams - base_weight_grams
    extra_kg = Decimal(extra_grams) / Decimal(1000)
    overage = (extra_kg * per_kg_rate).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    return base_rate + overage
