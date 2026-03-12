"""
Instamojo Integration Service
==============================
Handles:
1. Creating Instamojo payment requests
2. Verifying payment status via webhook/redirect
3. Logging every event for audit trail
"""

import hmac
import hashlib
import logging
import requests
from decimal import Decimal
from django.conf import settings
from django.utils import timezone

from .models import Order, InstamojoTransaction, PaymentLog

logger = logging.getLogger(__name__)


def _get_headers():
    """Get Instamojo API headers."""
    api_key = getattr(settings, 'INSTAMOJO_API_KEY', '')
    auth_token = getattr(settings, 'INSTAMOJO_AUTH_TOKEN', '')
    if not api_key or not auth_token:
        raise ValueError("INSTAMOJO_API_KEY and INSTAMOJO_AUTH_TOKEN must be set in settings/env.")
    return {
        'X-Api-Key': api_key,
        'X-Auth-Token': auth_token,
    }


def _get_base_url():
    """Get Instamojo base URL (production or sandbox)."""
    return getattr(settings, 'INSTAMOJO_BASE_URL', 'https://www.instamojo.com')


def _log_event(*, order=None, transaction=None, user=None, event_type,
               instamojo_payment_request_id='', instamojo_payment_id='',
               request_payload=None, response_payload=None,
               is_success=True, error_message='',
               ip_address=None, user_agent=''):
    """Create an immutable PaymentLog entry."""
    return PaymentLog.objects.create(
        order=order,
        instamojo_transaction=transaction,
        user=user,
        event_type=event_type,
        instamojo_payment_request_id=instamojo_payment_request_id,
        instamojo_payment_id=instamojo_payment_id,
        request_payload=request_payload,
        response_payload=response_payload,
        is_success=is_success,
        error_message=error_message,
        ip_address=ip_address,
        user_agent=user_agent,
    )


# ─── 1. CREATE INSTAMOJO PAYMENT REQUEST ─────────────────────────────────

def create_instamojo_payment(order: Order, user, redirect_url='', webhook_url='',
                              ip_address=None, user_agent=''):
    """
    Creates an Instamojo payment request for the given Order.
    Returns the InstamojoTransaction + Instamojo response dict.
    """
    headers = _get_headers()
    base_url = _get_base_url()
    amount = str(order.total_amount)

    payload = {
        'purpose': f'Order #{order.id} - PrintDoot',
        'amount': amount,
        'buyer_name': user.get_full_name() or user.username,
        'email': user.email or '',
        'phone': getattr(user, 'phone_number', '') or '',
        'redirect_url': redirect_url,
        'webhook': webhook_url,
        'send_email': False,
        'send_sms': False,
        'allow_repeated_payments': False,
    }

    try:
        response = requests.post(
            f'{base_url}/api/1.1/payment-requests/',
            data=payload,
            headers=headers,
            timeout=30,
        )
        response_data = response.json()

        # Log the HTTP status for debugging permission errors
        if response.status_code == 403 or response.status_code == 401:
            logger.error(
                f"Instamojo auth error (HTTP {response.status_code}): {response_data}. "
                f"Check INSTAMOJO_API_KEY/AUTH_TOKEN and ensure your Instamojo account "
                f"has completed KYC. For testing, use https://test.instamojo.com with test credentials."
            )
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

    if not response_data.get('success'):
        error_msg = str(response_data.get('message', 'Unknown Instamojo error'))
        # Provide actionable hint for "permission" errors
        if 'permission' in error_msg.lower():
            error_msg = (
                "Instamojo account does not have permission to create payments. "
                "Please complete KYC on your Instamojo account, or switch to "
                "the test environment (https://test.instamojo.com) with test credentials."
            )
        _log_event(
            order=order, user=user,
            event_type='order_created',
            request_payload=payload,
            response_payload=response_data,
            is_success=False,
            error_message=error_msg,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        raise ValueError(f"Instamojo error: {error_msg}")

    payment_request = response_data['payment_request']
    payment_request_id = payment_request['id']
    longurl = payment_request['longurl']

    # Create or update the transaction record
    transaction, created = InstamojoTransaction.objects.update_or_create(
        order=order,
        defaults={
            'user': user,
            'instamojo_payment_request_id': payment_request_id,
            'amount': Decimal(amount),
            'currency': 'INR',
            'status': 'created',
            'purpose': payload['purpose'],
            'longurl': longurl,
            'raw_response': payment_request,
        }
    )

    _log_event(
        order=order, transaction=transaction, user=user,
        event_type='order_created',
        instamojo_payment_request_id=payment_request_id,
        request_payload=payload,
        response_payload=payment_request,
        is_success=True,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    return transaction, payment_request


# ─── 2. VERIFY PAYMENT STATUS ────────────────────────────────────────────

def verify_payment(payment_request_id, payment_id,
                   user=None, ip_address=None, user_agent=''):
    """
    Verifies Instamojo payment by checking the payment status via API.
    On success: marks transaction as captured, transitions order to Paid.
    Returns (transaction, success_bool, error_msg).
    """
    try:
        transaction = InstamojoTransaction.objects.select_related('order').get(
            instamojo_payment_request_id=payment_request_id
        )
    except InstamojoTransaction.DoesNotExist:
        return None, False, f'No transaction found for payment request: {payment_request_id}'

    # Ownership check: ensure the authenticated user owns this transaction
    if user and transaction.user_id != user.id:
        logger.warning(
            f"Payment verify IDOR attempt: user {user.id} tried to verify "
            f"transaction belonging to user {transaction.user_id} "
            f"(payment_request={payment_request_id})"
        )
        return None, False, 'Transaction does not belong to the authenticated user.'

    order = transaction.order

    # Check payment status via Instamojo API
    headers = _get_headers()
    base_url = _get_base_url()

    try:
        response = requests.get(
            f'{base_url}/api/1.1/payment-requests/{payment_request_id}/{payment_id}/',
            headers=headers,
            timeout=30,
        )
        response_data = response.json()
    except Exception as e:
        _log_event(
            order=order, transaction=transaction, user=user,
            event_type='signature_failed',
            instamojo_payment_request_id=payment_request_id,
            instamojo_payment_id=payment_id,
            is_success=False,
            error_message=f'API call failed: {str(e)}',
            ip_address=ip_address,
            user_agent=user_agent,
        )
        return transaction, False, f'Failed to verify payment: {str(e)}'

    if not response_data.get('success'):
        transaction.status = 'failed'
        transaction.error_description = 'Payment verification failed via API.'
        transaction.save()

        _log_event(
            order=order, transaction=transaction, user=user,
            event_type='signature_failed',
            instamojo_payment_request_id=payment_request_id,
            instamojo_payment_id=payment_id,
            response_payload=response_data,
            is_success=False,
            error_message='Payment not found or invalid',
            ip_address=ip_address,
            user_agent=user_agent,
        )
        return transaction, False, 'Payment verification failed.'

    payment_info = response_data.get('payment_request', {})
    payment_detail = response_data.get('payment', response_data.get('payment_request', {}))

    # Check if payment status is 'Credit' (successful)
    payment_status = ''
    if 'payment' in response_data:
        payment_status = response_data['payment'].get('status', '')
    elif 'payment_request' in response_data:
        # Fallback: check payment_request status
        payment_status = payment_info.get('status', '')

    is_credit = payment_status.lower() == 'credit'

    if not is_credit:
        transaction.status = 'failed'
        transaction.error_description = f'Payment status: {payment_status}'
        transaction.save()

        _log_event(
            order=order, transaction=transaction, user=user,
            event_type='payment_failed',
            instamojo_payment_request_id=payment_request_id,
            instamojo_payment_id=payment_id,
            response_payload=response_data,
            is_success=False,
            error_message=f'Payment status is {payment_status}, not Credit',
            ip_address=ip_address,
            user_agent=user_agent,
        )
        return transaction, False, f'Payment not completed. Status: {payment_status}'

    # Amount verification: ensure paid amount matches order total (prevent tampering)
    paid_amount_str = response_data.get('payment', {}).get('amount', '')
    if paid_amount_str:
        try:
            paid_amount = Decimal(str(paid_amount_str))
            if paid_amount != order.total_amount:
                logger.error(
                    f"AMOUNT MISMATCH for Order #{order.id}: "
                    f"paid={paid_amount}, expected={order.total_amount}"
                )
                transaction.status = 'failed'
                transaction.error_description = (
                    f'Amount mismatch: paid ₹{paid_amount}, expected ₹{order.total_amount}'
                )
                transaction.save()

                _log_event(
                    order=order, transaction=transaction, user=user,
                    event_type='payment_failed',
                    instamojo_payment_request_id=payment_request_id,
                    instamojo_payment_id=payment_id,
                    response_payload=response_data,
                    is_success=False,
                    error_message=f'Amount mismatch: paid {paid_amount}, expected {order.total_amount}',
                    ip_address=ip_address,
                    user_agent=user_agent,
                )
                return transaction, False, 'Payment amount does not match order total. Contact support.'
        except (ValueError, TypeError) as e:
            logger.warning(f"Could not parse paid amount '{paid_amount_str}': {e}")

    # Payment successful — update transaction
    transaction.instamojo_payment_id = payment_id
    transaction.status = 'captured'
    transaction.method = response_data.get('payment', {}).get('instrument_type', '')
    transaction.raw_response = response_data
    transaction.save()

    _log_event(
        order=order, transaction=transaction, user=user,
        event_type='signature_verified',
        instamojo_payment_request_id=payment_request_id,
        instamojo_payment_id=payment_id,
        response_payload=response_data,
        is_success=True,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    # Transition order to Paid
    if order.can_transition_to('Paid'):
        order.payment_method = 'instamojo'
        order.transaction_id = payment_id
        order.save(update_fields=['payment_method', 'transaction_id'])
        order.transition_status('Paid', changed_by=user, note='Payment verified via Instamojo')

        # Auto-generate invoice
        _create_invoice_for_order(order)

    _log_event(
        order=order, transaction=transaction, user=user,
        event_type='payment_success',
        instamojo_payment_request_id=payment_request_id,
        instamojo_payment_id=payment_id,
        is_success=True,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    return transaction, True, ''


# ─── 3. WEBHOOK HANDLER ──────────────────────────────────────────────────

def verify_webhook_signature(payload_data: dict) -> bool:
    """
    Verify that the webhook request came from Instamojo using the private salt.
    Instamojo sends MAC in the webhook payload.
    """
    private_salt = getattr(settings, 'INSTAMOJO_PRIVATE_SALT', '')
    if not private_salt:
        logger.error(
            "INSTAMOJO_PRIVATE_SALT not set — REJECTING webhook. "
            "Set INSTAMOJO_PRIVATE_SALT in environment variables."
        )
        return False

    mac_provided = payload_data.get('mac', '')
    if not mac_provided:
        logger.warning("Instamojo webhook received without MAC")
        return False

    # Build the message string from sorted non-mac fields
    # Instamojo MAC: HMAC-SHA1 of sorted values joined by '|'
    keys_to_use = sorted([k for k in payload_data.keys() if k != 'mac'])
    message = '|'.join([str(payload_data[k]) for k in keys_to_use])

    generated_mac = hmac.new(
        private_salt.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha1
    ).hexdigest()

    return hmac.compare_digest(generated_mac, mac_provided)


def handle_webhook_event(payload: dict) -> dict:
    """
    Process an Instamojo webhook event.
    Returns a dict with 'status' and 'message'.
    """
    payment_request_id = payload.get('payment_request_id', '')
    payment_id = payload.get('payment_id', '')
    status_value = payload.get('status', '')

    if not payment_request_id:
        return {'status': 'ignored', 'message': 'No payment_request_id in payload'}

    try:
        transaction = InstamojoTransaction.objects.select_related('order', 'user').get(
            instamojo_payment_request_id=payment_request_id
        )
    except InstamojoTransaction.DoesNotExist:
        logger.warning(f"Webhook: No transaction for Instamojo payment request {payment_request_id}")
        return {'status': 'ignored', 'message': f'Unknown payment request: {payment_request_id}'}

    order = transaction.order
    user = transaction.user

    if status_value.lower() == 'credit':
        # Amount verification: check webhook amount against order total
        webhook_amount = payload.get('amount', '')
        if webhook_amount:
            try:
                paid_amount = Decimal(str(webhook_amount))
                if paid_amount != order.total_amount:
                    logger.error(
                        f"WEBHOOK AMOUNT MISMATCH for Order #{order.id}: "
                        f"webhook={paid_amount}, expected={order.total_amount}"
                    )
                    _log_event(
                        order=order, transaction=transaction, user=user,
                        event_type='webhook_payment_failed',
                        instamojo_payment_request_id=payment_request_id,
                        instamojo_payment_id=payment_id,
                        response_payload=payload,
                        is_success=False,
                        error_message=f'Amount mismatch: webhook {paid_amount}, expected {order.total_amount}',
                    )
                    return {
                        'status': 'rejected',
                        'message': f'Amount mismatch: received {paid_amount}, expected {order.total_amount}'
                    }
            except (ValueError, TypeError) as e:
                logger.warning(f"Could not parse webhook amount '{webhook_amount}': {e}")

        transaction.instamojo_payment_id = payment_id
        transaction.status = 'captured'
        transaction.raw_response = payload
        transaction.save()

        # Transition order if still Pending
        if order.can_transition_to('Paid'):
            order.payment_method = 'instamojo'
            order.transaction_id = payment_id
            order.save(update_fields=['payment_method', 'transaction_id'])
            order.transition_status('Paid', changed_by=None, note='Payment confirmed via Instamojo webhook')
            _create_invoice_for_order(order)

        _log_event(
            order=order, transaction=transaction, user=user,
            event_type='webhook_payment_captured',
            instamojo_payment_request_id=payment_request_id,
            instamojo_payment_id=payment_id,
            response_payload=payload,
            is_success=True,
        )
        return {'status': 'processed', 'message': 'Payment captured'}

    else:
        # Payment failed or other status
        transaction.status = 'failed'
        transaction.instamojo_payment_id = payment_id
        transaction.error_description = f'Webhook status: {status_value}'
        transaction.raw_response = payload
        transaction.save()

        _log_event(
            order=order, transaction=transaction, user=user,
            event_type='webhook_payment_failed',
            instamojo_payment_request_id=payment_request_id,
            instamojo_payment_id=payment_id,
            response_payload=payload,
            is_success=False,
            error_message=f'Payment status: {status_value}',
        )
        return {'status': 'processed', 'message': f'Payment status: {status_value}'}


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
