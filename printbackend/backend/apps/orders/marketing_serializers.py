"""Serializers for marketing campaigns, abandoned carts, and settings."""
from rest_framework import serializers
from .marketing_models import Campaign, CampaignLog, AbandonedCart, MarketingSettings


class CampaignSerializer(serializers.ModelSerializer):
    created_by_name = serializers.ReadOnlyField(source='created_by.username')

    class Meta:
        model = Campaign
        fields = [
            'id', 'name', 'channel', 'status', 'trigger_type',
            'subject', 'email_body', 'whatsapp_message',
            'target_all_users', 'target_users',
            'scheduled_at', 'sent_at',
            'total_recipients', 'emails_sent', 'emails_opened', 'emails_clicked',
            'whatsapp_sent', 'whatsapp_delivered', 'whatsapp_read',
            'created_by', 'created_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'sent_at', 'total_recipients',
            'emails_sent', 'emails_opened', 'emails_clicked',
            'whatsapp_sent', 'whatsapp_delivered', 'whatsapp_read',
            'created_by', 'created_by_name',
            'created_at', 'updated_at',
        ]


class CampaignLogSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = CampaignLog
        fields = [
            'id', 'campaign', 'user', 'user_email', 'channel', 'status',
            'sent_at', 'delivered_at', 'opened_at', 'clicked_at',
            'error_message', 'created_at',
        ]
        read_only_fields = fields


class AbandonedCartSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')
    user_name = serializers.SerializerMethodField()
    user_phone = serializers.ReadOnlyField(source='user.phone')

    class Meta:
        model = AbandonedCart
        fields = [
            'id', 'user', 'user_email', 'user_name', 'user_phone',
            'cart_data', 'cart_total', 'status',
            'reminder_count', 'last_reminder_at',
            'email_sent', 'whatsapp_sent',
            'recovered_order', 'recovered_at',
            'abandoned_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'user_email', 'user_name', 'user_phone',
            'recovered_order', 'recovered_at',
            'abandoned_at', 'updated_at',
        ]

    def get_user_name(self, obj):
        if obj.user.first_name:
            return f"{obj.user.first_name} {obj.user.last_name}".strip()
        return obj.user.username


class MarketingSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketingSettings
        fields = [
            'cart_abandonment_enabled', 'cart_abandonment_delay_minutes',
            'cart_abandonment_max_reminders',
            'whatsapp_enabled', 'whatsapp_api_provider',
            'email_campaigns_enabled',
            'updated_at',
        ]
        read_only_fields = ['updated_at']
