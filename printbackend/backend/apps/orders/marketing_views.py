"""
Marketing Admin Views - Campaign management, abandoned cart tracking, and marketing automation.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Count, Sum, Q
from datetime import timedelta

from .marketing_models import Campaign, CampaignLog, AbandonedCart, MarketingSettings
from .marketing_serializers import (
    CampaignSerializer, CampaignLogSerializer,
    AbandonedCartSerializer, MarketingSettingsSerializer,
)
from apps.users.permissions import IsAdminOrStaff


class CampaignViewSet(viewsets.ModelViewSet):
    """Admin CRUD for marketing campaigns."""
    queryset = Campaign.objects.all()
    serializer_class = CampaignSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrStaff]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """
        Trigger sending a campaign.
        For email: uses Django's email backend (SMTP/SES).
        For WhatsApp: uses configured WhatsApp API provider.
        """
        campaign = self.get_object()

        if campaign.status not in ('draft', 'scheduled', 'paused'):
            return Response(
                {'error': f'Cannot send campaign in {campaign.status} status.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get target recipients
        if campaign.target_all_users:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            recipients = User.objects.filter(is_active=True, marketing_opt_in=True)
        else:
            recipients = campaign.target_users.filter(is_active=True)

        if not recipients.exists():
            return Response(
                {'error': 'No recipients found for this campaign.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        campaign.status = 'sending'
        campaign.total_recipients = recipients.count()
        campaign.save()

        sent_count = 0
        errors = []

        for user in recipients:
            try:
                # Send email
                if campaign.channel in ('email', 'both') and user.email:
                    success = self._send_email(campaign, user)
                    if success:
                        CampaignLog.objects.create(
                            campaign=campaign, user=user,
                            channel='email', status='sent',
                            sent_at=timezone.now()
                        )
                        sent_count += 1
                    else:
                        CampaignLog.objects.create(
                            campaign=campaign, user=user,
                            channel='email', status='failed',
                            error_message='Email delivery failed'
                        )

                # Send WhatsApp
                if campaign.channel in ('whatsapp', 'both') and user.phone:
                    success = self._send_whatsapp(campaign, user)
                    if success:
                        CampaignLog.objects.create(
                            campaign=campaign, user=user,
                            channel='whatsapp', status='sent',
                            sent_at=timezone.now()
                        )
                        campaign.whatsapp_sent += 1
                    else:
                        CampaignLog.objects.create(
                            campaign=campaign, user=user,
                            channel='whatsapp', status='failed',
                            error_message='WhatsApp delivery failed'
                        )
            except Exception as e:
                errors.append(f"{user.email}: {str(e)}")

        campaign.emails_sent = sent_count
        campaign.status = 'sent'
        campaign.sent_at = timezone.now()
        campaign.save()

        return Response({
            'status': 'sent',
            'total_recipients': campaign.total_recipients,
            'emails_sent': sent_count,
            'whatsapp_sent': campaign.whatsapp_sent,
            'errors': errors[:10],  # First 10 errors
        })

    def _send_email(self, campaign, user):
        """Send campaign email to a single user."""
        try:
            from django.core.mail import send_mail
            from django.conf import settings as django_settings

            # Simple template variable replacement
            body = campaign.email_body
            body = body.replace('{{name}}', user.first_name or user.username)
            body = body.replace('{{email}}', user.email or '')

            subject = campaign.subject
            subject = subject.replace('{{name}}', user.first_name or user.username)

            send_mail(
                subject=subject,
                message='',  # plain text fallback
                from_email=django_settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=body,
                fail_silently=False,
            )
            return True
        except Exception:
            return False

    def _send_whatsapp(self, campaign, user):
        """
        Send WhatsApp message via configured provider.
        Supports: Twilio, WATI, Interakt, Gupshup.
        Returns True if sent successfully.
        """
        try:
            settings_obj = MarketingSettings.get_settings()
            if not settings_obj.whatsapp_enabled:
                return False

            from django.conf import settings as django_settings
            provider = settings_obj.whatsapp_api_provider.lower()

            message = campaign.whatsapp_message
            message = message.replace('{{name}}', user.first_name or user.username)
            phone = user.phone

            if not phone:
                return False

            if provider == 'twilio':
                return self._send_via_twilio(phone, message, django_settings)
            elif provider == 'interakt':
                return self._send_via_interakt(phone, message, django_settings)
            elif provider == 'gupshup':
                return self._send_via_gupshup(phone, message, django_settings)
            else:
                # Generic webhook-based sending
                return self._send_via_webhook(phone, message, django_settings)
        except Exception:
            return False

    def _send_via_twilio(self, phone, message, settings):
        """Send WhatsApp message via Twilio."""
        import requests
        account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', '')
        auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', '')
        from_number = getattr(settings, 'TWILIO_WHATSAPP_FROM', '')

        if not all([account_sid, auth_token, from_number]):
            return False

        url = f'https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json'
        resp = requests.post(url, data={
            'From': f'whatsapp:{from_number}',
            'To': f'whatsapp:{phone}',
            'Body': message,
        }, auth=(account_sid, auth_token), timeout=30)

        return resp.status_code == 201

    def _send_via_interakt(self, phone, message, settings):
        """Send WhatsApp message via Interakt."""
        import requests
        api_key = getattr(settings, 'INTERAKT_API_KEY', '')
        if not api_key:
            return False

        url = 'https://api.interakt.ai/v1/public/message/'
        resp = requests.post(url, json={
            'countryCode': '+91',
            'phoneNumber': phone.lstrip('+91').lstrip('91'),
            'type': 'Text',
            'data': {'message': message},
        }, headers={'Authorization': f'Basic {api_key}'}, timeout=30)

        return resp.status_code == 200

    def _send_via_gupshup(self, phone, message, settings):
        """Send WhatsApp message via Gupshup."""
        import requests
        api_key = getattr(settings, 'GUPSHUP_API_KEY', '')
        app_name = getattr(settings, 'GUPSHUP_APP_NAME', '')
        source = getattr(settings, 'GUPSHUP_SOURCE_NUMBER', '')

        if not all([api_key, app_name, source]):
            return False

        url = 'https://api.gupshup.io/sm/api/v1/msg'
        resp = requests.post(url, data={
            'channel': 'whatsapp',
            'source': source,
            'destination': phone,
            'message': message,
            'src.name': app_name,
        }, headers={'apikey': api_key}, timeout=30)

        return resp.status_code == 200

    def _send_via_webhook(self, phone, message, settings):
        """Generic webhook-based WhatsApp sending."""
        import requests
        webhook_url = getattr(settings, 'WHATSAPP_WEBHOOK_URL', '')
        if not webhook_url:
            return False

        resp = requests.post(webhook_url, json={
            'phone': phone,
            'message': message,
        }, timeout=30)
        return resp.status_code in (200, 201)

    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        """Get analytics for a specific campaign."""
        campaign = self.get_object()
        logs = campaign.logs.all()

        return Response({
            'campaign_id': campaign.id,
            'name': campaign.name,
            'status': campaign.status,
            'total_recipients': campaign.total_recipients,
            'emails_sent': campaign.emails_sent,
            'emails_opened': campaign.emails_opened,
            'emails_clicked': campaign.emails_clicked,
            'whatsapp_sent': campaign.whatsapp_sent,
            'whatsapp_delivered': campaign.whatsapp_delivered,
            'whatsapp_read': campaign.whatsapp_read,
            'open_rate': round((campaign.emails_opened / max(campaign.emails_sent, 1)) * 100, 1),
            'click_rate': round((campaign.emails_clicked / max(campaign.emails_sent, 1)) * 100, 1),
            'delivery_breakdown': {
                'sent': logs.filter(status='sent').count(),
                'delivered': logs.filter(status='delivered').count(),
                'opened': logs.filter(status='opened').count(),
                'clicked': logs.filter(status='clicked').count(),
                'bounced': logs.filter(status='bounced').count(),
                'failed': logs.filter(status='failed').count(),
            }
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Overall marketing statistics."""
        total_campaigns = Campaign.objects.count()
        active_campaigns = Campaign.objects.filter(status__in=['scheduled', 'sending']).count()
        sent_campaigns = Campaign.objects.filter(status='sent').count()

        total_emails_sent = Campaign.objects.aggregate(
            total=Sum('emails_sent'))['total'] or 0
        total_whatsapp_sent = Campaign.objects.aggregate(
            total=Sum('whatsapp_sent'))['total'] or 0

        # Abandoned carts stats
        abandoned_carts = AbandonedCart.objects.filter(status='abandoned').count()
        recovered_carts = AbandonedCart.objects.filter(status='recovered').count()
        recovery_rate = round(
            (recovered_carts / max(abandoned_carts + recovered_carts, 1)) * 100, 1
        )

        return Response({
            'total_campaigns': total_campaigns,
            'active_campaigns': active_campaigns,
            'sent_campaigns': sent_campaigns,
            'total_emails_sent': total_emails_sent,
            'total_whatsapp_sent': total_whatsapp_sent,
            'abandoned_carts': abandoned_carts,
            'recovered_carts': recovered_carts,
            'recovery_rate': recovery_rate,
        })


class AbandonedCartViewSet(viewsets.ModelViewSet):
    """Admin view for managing abandoned carts."""
    queryset = AbandonedCart.objects.all().select_related('user')
    serializer_class = AbandonedCartSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrStaff]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    @action(detail=True, methods=['post'], url_path='send-reminder')
    def send_reminder(self, request, pk=None):
        """Send a reminder to the user about their abandoned cart."""
        cart = self.get_object()
        settings_obj = MarketingSettings.get_settings()

        if cart.reminder_count >= settings_obj.cart_abandonment_max_reminders:
            return Response(
                {'error': 'Maximum reminders already sent.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = cart.user
        errors = []

        # Build product list for the message
        items_text = ""
        for item in cart.cart_data:
            items_text += f"• {item.get('name', 'Product')} (Qty: {item.get('quantity', 1)}) - ₹{item.get('price', 0)}\n"

        # Send email reminder
        if user.email:
            try:
                from django.core.mail import send_mail
                from django.conf import settings as django_settings

                subject = f"You left something behind! Complete your order at PrintDoot"
                html_body = f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Hi {user.first_name or user.username}! 👋</h2>
                    <p>We noticed you left some items in your cart:</p>
                    <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
                        <pre style="white-space: pre-wrap;">{items_text}</pre>
                        <p style="font-weight: bold; font-size: 18px;">Total: ₹{cart.cart_total}</p>
                    </div>
                    <p>Complete your order before they're gone!</p>
                    <a href="{django_settings.FRONTEND_URL}/cart"
                       style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px;
                              text-decoration: none; border-radius: 8px; margin: 16px 0;">
                        Complete Your Order →
                    </a>
                    <p style="color: #6b7280; font-size: 12px; margin-top: 32px;">
                        If you have any questions, reply to this email or contact us at support@printdoot.com
                    </p>
                </div>
                """

                send_mail(
                    subject=subject,
                    message=f"Hi {user.first_name or user.username}, you left items in your cart worth ₹{cart.cart_total}. Complete your order at {django_settings.FRONTEND_URL}/cart",
                    from_email=django_settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    html_message=html_body,
                    fail_silently=False,
                )
                cart.email_sent = True
            except Exception as e:
                errors.append(f"Email failed: {str(e)}")

        # Send WhatsApp reminder
        if user.phone and settings_obj.whatsapp_enabled:
            try:
                whatsapp_msg = (
                    f"Hi {user.first_name or user.username}! 👋\n\n"
                    f"You have items worth ₹{cart.cart_total} in your PrintDoot cart.\n\n"
                    f"{items_text}\n"
                    f"Complete your order now: {django_settings.FRONTEND_URL}/cart\n\n"
                    f"Need help? Reply to this message!"
                )
                # Use the campaign viewset's WhatsApp sending logic
                dummy_campaign = type('obj', (object,), {'whatsapp_message': whatsapp_msg})()
                view = CampaignViewSet()
                success = view._send_whatsapp(dummy_campaign, user)
                if success:
                    cart.whatsapp_sent = True
                else:
                    errors.append("WhatsApp sending failed or not configured")
            except Exception as e:
                errors.append(f"WhatsApp failed: {str(e)}")

        cart.reminder_count += 1
        cart.last_reminder_at = timezone.now()
        cart.status = 'reminder_sent'
        cart.save()

        return Response({
            'status': 'reminder_sent',
            'email_sent': cart.email_sent,
            'whatsapp_sent': cart.whatsapp_sent,
            'reminder_count': cart.reminder_count,
            'errors': errors,
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Abandoned cart statistics."""
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)

        total = AbandonedCart.objects.count()
        abandoned = AbandonedCart.objects.filter(status='abandoned').count()
        recovered = AbandonedCart.objects.filter(status='recovered').count()
        reminder_sent = AbandonedCart.objects.filter(status='reminder_sent').count()

        # Revenue recovered
        from django.db.models import DecimalField
        from django.db.models.functions import Coalesce
        from decimal import Decimal
        revenue_recovered = AbandonedCart.objects.filter(
            status='recovered'
        ).aggregate(
            total=Coalesce(Sum('cart_total'), Decimal('0'))
        )['total']

        revenue_at_risk = AbandonedCart.objects.filter(
            status__in=['abandoned', 'reminder_sent']
        ).aggregate(
            total=Coalesce(Sum('cart_total'), Decimal('0'))
        )['total']

        return Response({
            'total': total,
            'abandoned': abandoned,
            'recovered': recovered,
            'reminder_sent': reminder_sent,
            'recovery_rate': round((recovered / max(total, 1)) * 100, 1),
            'revenue_recovered': str(revenue_recovered),
            'revenue_at_risk': str(revenue_at_risk),
        })


class MarketingSettingsView(APIView):
    """Get/update global marketing settings."""
    permission_classes = [permissions.IsAuthenticated, IsAdminOrStaff]

    def get(self, request):
        settings_obj = MarketingSettings.get_settings()
        return Response(MarketingSettingsSerializer(settings_obj).data)

    def put(self, request):
        settings_obj = MarketingSettings.get_settings()
        serializer = MarketingSettingsSerializer(settings_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
