"""
Transactional Email Service for the Print Shop.

Sends emails for:
- Order Confirmation (when order is placed)
- Payment Confirmation (when payment is verified)
- Shipping Update (when shipment status changes)

Uses Django's email framework.
In dev: console backend (prints to terminal).
In prod: SMTP (Gmail/SendGrid/Amazon SES).
"""

import logging
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


def _send_email(subject, template_name, context, recipient_email):
    """
    Internal helper to render an HTML template and send email.

    Args:
        subject: Email subject line
        template_name: Path to the HTML template (relative to templates/)
        context: Dict of template context variables
        recipient_email: Recipient's email address

    Returns:
        True if sent successfully, False otherwise
    """
    if not recipient_email:
        logger.warning(f"Cannot send email '{subject}': no recipient email address.")
        return False

    # Add common context
    context.setdefault('frontend_url', getattr(settings, 'FRONTEND_URL', 'http://localhost:5173'))
    context.setdefault('shop_name', 'PrintShop')
    context.setdefault('support_email', getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@printshop.com'))

    try:
        html_message = render_to_string(template_name, context)
        plain_message = strip_tags(html_message)

        send_mail(
            subject=subject,
            message=plain_message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@printshop.com'),
            recipient_list=[recipient_email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Email sent: '{subject}' to {recipient_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email '{subject}' to {recipient_email}: {e}")
        return False


# =============================================================================
# Order Confirmation Email
# =============================================================================

def send_order_confirmation_email(order):
    """
    Send order confirmation email when an order is placed.

    Args:
        order: Order model instance (with items, user prefetched)
    """
    user = order.user
    items = order.items.select_related('product').all()

    context = {
        'order': order,
        'user': user,
        'items': items,
        'order_url': f"{settings.FRONTEND_URL}/account/orders/{order.id}",
    }

    return _send_email(
        subject=f"Order Confirmed — #{order.id}",
        template_name='emails/order_confirmation.html',
        context=context,
        recipient_email=user.email,
    )


# =============================================================================
# Payment Confirmation Email
# =============================================================================

def send_payment_confirmation_email(order, transaction=None):
    """
    Send payment confirmation email when payment is verified.

    Args:
        order: Order model instance
        transaction: RazorpayTransaction instance (optional)
    """
    user = order.user
    items = order.items.select_related('product').all()

    context = {
        'order': order,
        'user': user,
        'items': items,
        'transaction': transaction,
        'payment_method': transaction.method if transaction else order.payment_method,
        'amount_paid': f"₹{order.total_amount:,.2f}",
        'order_url': f"{settings.FRONTEND_URL}/account/orders/{order.id}",
    }

    return _send_email(
        subject=f"Payment Received — Order #{order.id}",
        template_name='emails/payment_confirmation.html',
        context=context,
        recipient_email=user.email,
    )


# =============================================================================
# Shipping Update Email
# =============================================================================

def send_shipping_update_email(order, shipment):
    """
    Send shipping update email when shipment status changes.

    Args:
        order: Order model instance
        shipment: Shipment model instance
    """
    user = order.user

    # Get latest tracking events
    recent_events = shipment.tracking_events.all()[:5]

    context = {
        'order': order,
        'user': user,
        'shipment': shipment,
        'recent_events': recent_events,
        'tracking_url': f"{settings.FRONTEND_URL}/account/orders/{order.id}",
        'carrier': shipment.courier_name or shipment.carrier,
        'tracking_number': shipment.awb_code or shipment.tracking_number,
    }

    # Customize subject based on status
    status_subjects = {
        'picked_up': f"Your Order #{order.id} Has Been Picked Up",
        'in_transit': f"Your Order #{order.id} Is In Transit",
        'out_for_delivery': f"Your Order #{order.id} Is Out for Delivery! 🎉",
        'delivered': f"Your Order #{order.id} Has Been Delivered! ✅",
    }
    subject = status_subjects.get(
        shipment.status,
        f"Shipping Update — Order #{order.id}"
    )

    return _send_email(
        subject=subject,
        template_name='emails/shipping_update.html',
        context=context,
        recipient_email=user.email,
    )
