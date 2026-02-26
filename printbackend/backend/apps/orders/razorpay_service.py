"""
Razorpay Integration Service
=============================
Handles:
1. Creating Razorpay orders
2. Verifying payment signatures
3. Processing webhook events
4. Logging every event for audit trail
"""

import razorpay
import hmac
import hashlib
import logging
from decimal import Decimal
from django.conf import settings
from django.utils import timezone

from .models import Order, RazorpayTransaction, PaymentLog

logger = logging.getLogger(__name__)


def _get_client():
    """Get a configured Razorpay client."""
    key_id = getattr(settings, 'RAZORPAY_KEY_ID', '')
    key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', '')
    if not key_id or not key_secret:
        raise ValueError("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in settings/env.")
    return razorpay.Client(auth=(key_id, key_secret))


def _log_event(*, order=None, transaction=None, user=None, event_type,
               razorpay_order_id='', razorpay_payment_id='',
               request_payload=None, response_payload=None,
               is_success=True, error_message='',
               ip_address=None, user_agent=''):
    """Create an immutable PaymentLog entry."""
    return PaymentLog.objects.create(
        order=order,
        razorpay_transaction=transaction,
        user=user,
        event_type=event_type,
        razorpay_order_id=razorpay_order_id,
        razorpay_payment_id=razorpay_payment_id,
        request_payload=request_payload,
        response_payload=response_payload,
        is_success=is_success,
        error_message=error_message,
        ip_address=ip_address,
        user_agent=user_agent,
    )


# ─── 1. CREATE RAZORPAY ORDER ────────────────────────────────────────────

def create_razorpay_order(order: Order, user, ip_address=None, user_agent=''):
    """
    Creates a Razorpay order for the given Order.
    Returns the RazorpayTransaction + razorpay response dict.
    """
    client = _get_client()
    amount_paisa = int(order.total_amount * 100)  # Convert ₹ to paisa

    payload = {
        'amount': amount_paisa,
        'currency': 'INR',
        'receipt': f'order_{order.id}',
        'notes': {
            'order_id': str(order.id),
            'user_id': str(user.id),
            'user_email': user.email or '',
        },
    }

    try:
        rz_order = client.order.create(data=payload)
    except Exception as e:
        _log_event(
            order=order, user=user,
            event_type='order_created',
            request_payload=payload,
            is_success=False,
            error_message=str(e),
            ip_address=ip_address,
            user_agent=user_agent,
        )
        raise

    # Create or update the transaction record
    transaction, created = RazorpayTransaction.objects.update_or_create(
        order=order,
        defaults={
            'user': user,
            'razorpay_order_id': rz_order['id'],
            'amount_paisa': amount_paisa,
            'currency': 'INR',
            'status': 'created',
            'raw_response': rz_order,
        }
    )

    _log_event(
        order=order, transaction=transaction, user=user,
        event_type='order_created',
        razorpay_order_id=rz_order['id'],
        request_payload=payload,
        response_payload=rz_order,
        is_success=True,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    return transaction, rz_order


# ─── 2. VERIFY PAYMENT SIGNATURE ─────────────────────────────────────────

def verify_payment(razorpay_order_id, razorpay_payment_id, razorpay_signature,
                   user=None, ip_address=None, user_agent=''):
    """
    Verifies Razorpay payment signature.
    On success: marks transaction as captured, transitions order to Paid.
    Returns (transaction, success_bool, error_msg).
    """
    try:
        transaction = RazorpayTransaction.objects.select_related('order').get(
            razorpay_order_id=razorpay_order_id
        )
    except RazorpayTransaction.DoesNotExist:
        return None, False, f'No transaction found for Razorpay order: {razorpay_order_id}'

    order = transaction.order

    # Verify signature using HMAC SHA256
    key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', '')
    message = f"{razorpay_order_id}|{razorpay_payment_id}"
    generated_signature = hmac.new(
        key_secret.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    if generated_signature != razorpay_signature:
        # Signature mismatch
        transaction.status = 'failed'
        transaction.error_code = 'SIGNATURE_MISMATCH'
        transaction.error_description = 'Payment signature verification failed.'
        transaction.save()

        _log_event(
            order=order, transaction=transaction, user=user,
            event_type='signature_failed',
            razorpay_order_id=razorpay_order_id,
            razorpay_payment_id=razorpay_payment_id,
            is_success=False,
            error_message='Signature mismatch',
            ip_address=ip_address,
            user_agent=user_agent,
        )
        return transaction, False, 'Payment signature verification failed.'

    # Signature valid → update transaction
    transaction.razorpay_payment_id = razorpay_payment_id
    transaction.razorpay_signature = razorpay_signature
    transaction.status = 'captured'
    transaction.save()

    _log_event(
        order=order, transaction=transaction, user=user,
        event_type='signature_verified',
        razorpay_order_id=razorpay_order_id,
        razorpay_payment_id=razorpay_payment_id,
        is_success=True,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    # Transition order to Paid
    if order.can_transition_to('Paid'):
        order.payment_method = 'razorpay'
        order.transaction_id = razorpay_payment_id
        order.save(update_fields=['payment_method', 'transaction_id'])
        order.transition_status('Paid', changed_by=user, note='Payment verified via Razorpay')

        # Auto-generate invoice
        _create_invoice_for_order(order)

    _log_event(
        order=order, transaction=transaction, user=user,
        event_type='payment_success',
        razorpay_order_id=razorpay_order_id,
        razorpay_payment_id=razorpay_payment_id,
        is_success=True,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    return transaction, True, ''


# ─── 3. WEBHOOK HANDLER ──────────────────────────────────────────────────

def verify_webhook_signature(request_body: bytes, signature: str) -> bool:
    """Verify that the webhook request came from Razorpay."""
    webhook_secret = getattr(settings, 'RAZORPAY_WEBHOOK_SECRET', '')
    if not webhook_secret:
        logger.error(
            "RAZORPAY_WEBHOOK_SECRET not set — REJECTING webhook. "
            "Set RAZORPAY_WEBHOOK_SECRET in environment variables."
        )
        return False  # NEVER allow unverified webhooks

    if not signature:
        logger.warning("Razorpay webhook received without signature header")
        return False

    generated = hmac.new(
        webhook_secret.encode('utf-8'),
        request_body,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(generated, signature)


def handle_webhook_event(event_type: str, payload: dict) -> dict:
    """
    Process a Razorpay webhook event.
    Returns a dict with 'status' and 'message'.
    """
    payment_entity = payload.get('payment', {}).get('entity', {})
    rz_order_id = payment_entity.get('order_id', '')

    if not rz_order_id:
        return {'status': 'ignored', 'message': 'No order_id in payload'}

    try:
        transaction = RazorpayTransaction.objects.select_related('order', 'user').get(
            razorpay_order_id=rz_order_id
        )
    except RazorpayTransaction.DoesNotExist:
        logger.warning(f"Webhook: No transaction for Razorpay order {rz_order_id}")
        return {'status': 'ignored', 'message': f'Unknown order: {rz_order_id}'}

    order = transaction.order
    user = transaction.user

    if event_type == 'payment.captured':
        transaction.razorpay_payment_id = payment_entity.get('id', '')
        transaction.status = 'captured'
        transaction.method = payment_entity.get('method', '')
        transaction.bank = payment_entity.get('bank', '') or ''
        transaction.wallet = payment_entity.get('wallet', '') or ''
        transaction.vpa = payment_entity.get('vpa', '') or ''
        transaction.email = payment_entity.get('email', '')
        transaction.contact = payment_entity.get('contact', '')
        transaction.raw_response = payment_entity
        transaction.save()

        # Transition order if still Pending
        if order.can_transition_to('Paid'):
            order.payment_method = transaction.method or 'razorpay'
            order.transaction_id = transaction.razorpay_payment_id
            order.save(update_fields=['payment_method', 'transaction_id'])
            order.transition_status('Paid', changed_by=None, note='Payment confirmed via Razorpay webhook')
            _create_invoice_for_order(order)

        _log_event(
            order=order, transaction=transaction, user=user,
            event_type='webhook_payment_captured',
            razorpay_order_id=rz_order_id,
            razorpay_payment_id=payment_entity.get('id', ''),
            response_payload=payment_entity,
            is_success=True,
        )
        return {'status': 'processed', 'message': 'Payment captured'}

    elif event_type == 'payment.failed':
        error_meta = payment_entity.get('error_meta_data', {})
        transaction.status = 'failed'
        transaction.razorpay_payment_id = payment_entity.get('id', '')
        transaction.error_code = payment_entity.get('error_code', '')
        transaction.error_description = payment_entity.get('error_description', '')
        transaction.error_reason = payment_entity.get('error_reason', '')
        transaction.raw_response = payment_entity
        transaction.save()

        _log_event(
            order=order, transaction=transaction, user=user,
            event_type='webhook_payment_failed',
            razorpay_order_id=rz_order_id,
            razorpay_payment_id=payment_entity.get('id', ''),
            response_payload=payment_entity,
            is_success=False,
            error_message=payment_entity.get('error_description', ''),
        )
        return {'status': 'processed', 'message': 'Payment failure recorded'}

    else:
        _log_event(
            order=order, transaction=transaction, user=user,
            event_type='webhook_received',
            razorpay_order_id=rz_order_id,
            response_payload=payload,
            is_success=True,
        )
        return {'status': 'ignored', 'message': f'Unhandled event: {event_type}'}


# ─── HELPERS ──────────────────────────────────────────────────────────────

def _create_invoice_for_order(order):
    """Create invoice + PDF if one doesn't exist yet."""
    from .models import Invoice
    from .invoice_generator import generate_invoice_pdf

    if hasattr(order, 'invoice'):
        return order.invoice

    invoice = Invoice.objects.create(
        order=order,
        subtotal=order.subtotal,
        tax_total=order.tax_total,
        shipping_total=order.shipping_total,
        discount_total=order.discount_total,
        grand_total=order.total_amount,
    )
    try:
        generate_invoice_pdf(invoice)
    except Exception as e:
        logger.error(f"Failed to generate invoice PDF for Order #{order.id}: {e}")
    return invoice
