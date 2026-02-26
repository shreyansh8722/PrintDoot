"""
Shipping Cost Calculator
========================
Calculates shipping fees based on:
  - Total order weight (sum of product weights × quantities)
  - Destination pincode → resolved to a ShippingZone
  - Shipping method (standard / express / priority)

Also provides serviceability checks (is this pincode deliverable?).
"""

from decimal import Decimal, ROUND_HALF_UP
from .models import ShippingZone, ShippingRate, PincodeServiceability


# ─── DEFAULT RATES (fallback when no zone data exists in DB) ─────────────

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
    Check if a pincode is serviceable.
    Returns:
    {
        'serviceable': True/False,
        'pincode': '400001',
        'city': 'Mumbai',
        'state': 'Maharashtra',
        'zone': 'Metro Cities',
        'available_methods': ['standard', 'express', 'priority'],
        'cod_available': True,
    }
    """
    try:
        entry = PincodeServiceability.objects.select_related('zone').get(
            pincode=pincode.strip(), is_active=True
        )
    except PincodeServiceability.DoesNotExist:
        # Pincode not in DB → still serviceable with standard defaults
        return {
            'serviceable': True,
            'pincode': pincode.strip(),
            'city': '',
            'state': '',
            'zone': 'Default',
            'available_methods': ['standard', 'express'],
            'cod_available': True,
        }

    methods = []
    if entry.standard_available:
        methods.append('standard')
    if entry.express_available:
        methods.append('express')
    if entry.priority_available:
        methods.append('priority')

    return {
        'serviceable': True,
        'pincode': entry.pincode,
        'city': entry.city,
        'state': entry.state,
        'zone': entry.zone.name,
        'available_methods': methods,
        'cod_available': entry.cod_available,
    }


def calculate_shipping(*, pincode: str, weight_grams: int, order_subtotal: Decimal,
                       method: str = 'standard') -> dict:
    """
    Calculate shipping cost for a given pincode, weight, and method.

    Args:
        pincode:        Destination pincode/ZIP
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
        'zone': 'Metro Cities',
    }
    """
    if method not in DEFAULT_RATES:
        raise ValueError(f"Invalid shipping method: {method}. Choose from: standard, express, priority")

    # Resolve zone from pincode
    zone = None
    try:
        entry = PincodeServiceability.objects.select_related('zone').get(
            pincode=pincode.strip(), is_active=True
        )
        zone = entry.zone
    except PincodeServiceability.DoesNotExist:
        pass  # Use defaults

    # Try to find a matching ShippingRate from DB
    rate = None
    if zone:
        rate = ShippingRate.objects.filter(
            zone=zone,
            method=method,
            is_active=True,
            min_weight_grams__lte=weight_grams,
            max_weight_grams__gte=weight_grams,
        ).first()

    if rate:
        # Calculate from DB rate
        cost = _compute_cost(
            base_rate=rate.base_rate,
            per_kg_rate=rate.per_kg_rate,
            base_weight_grams=rate.base_weight_grams,
            weight_grams=weight_grams,
        )
        free_above = rate.free_above
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
            'eta_min_days': rate.min_days,
            'eta_max_days': rate.max_days,
            'weight_grams': weight_grams,
            'zone': zone.name if zone else 'Default',
        }
    else:
        # Use default rates
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
            'zone': zone.name if zone else 'Default',
        }


def calculate_all_shipping_options(*, pincode: str, weight_grams: int,
                                    order_subtotal: Decimal) -> list:
    """
    Calculate shipping costs for ALL available methods at a given pincode.
    Returns a list of dicts (one per method), sorted cheapest first.
    """
    serviceability = check_serviceability(pincode)
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
    """
    if weight_grams <= base_weight_grams:
        return base_rate

    extra_grams = weight_grams - base_weight_grams
    extra_kg = Decimal(extra_grams) / Decimal(1000)
    overage = (extra_kg * per_kg_rate).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    return base_rate + overage
