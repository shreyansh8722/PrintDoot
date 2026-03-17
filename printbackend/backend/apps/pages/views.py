from rest_framework import generics, status as drf_status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import LegalPage, Offer, Banner, PromoCode
from .serializers import (
    LegalPageListSerializer, LegalPageDetailSerializer,
    OfferSerializer, BannerSerializer,
    PromoCodeValidateSerializer,
)
from django.utils import timezone


class OfferListView(generics.ListAPIView):
    """Public endpoint — list all active offers for the marquee."""
    serializer_class = OfferSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        return Offer.objects.filter(is_active=True)


class BannerListView(generics.ListAPIView):
    """Public endpoint — list all active banners, optionally filtered by position."""
    serializer_class = BannerSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        now = timezone.now()
        qs = Banner.objects.filter(is_active=True)
        # Filter out banners that haven't started yet
        qs = qs.exclude(start_date__gt=now)
        # Filter out expired banners
        qs = qs.exclude(end_date__lt=now, end_date__isnull=False)

        # Optional position filter
        position = self.request.query_params.get('position')
        if position:
            qs = qs.filter(position=position)
        return qs


class PromoCodeValidateView(APIView):
    """
    Public endpoint — validate a promo code and return discount info.
    POST { "code": "WELCOME20", "subtotal": 1500 }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PromoCodeValidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        code_str = serializer.validated_data['code'].upper().strip()
        subtotal = serializer.validated_data['subtotal']

        try:
            promo = PromoCode.objects.get(code=code_str)
        except PromoCode.DoesNotExist:
            return Response({'valid': False, 'message': 'Invalid promo code'}, status=drf_status.HTTP_404_NOT_FOUND)

        if not promo.is_valid():
            if promo.is_expired:
                msg = 'This promo code has expired'
            elif not promo.is_started:
                msg = 'This promo code is not active yet'
            elif promo.is_usage_exceeded:
                msg = 'This promo code has reached its usage limit'
            else:
                msg = 'This promo code is not active'
            return Response({'valid': False, 'message': msg}, status=drf_status.HTTP_400_BAD_REQUEST)

        discount = promo.apply_discount(subtotal)
        if discount == 0:
            return Response({
                'valid': False,
                'message': f'Minimum order amount is ₹{promo.min_order_amount}',
            }, status=drf_status.HTTP_400_BAD_REQUEST)

        return Response({
            'valid': True,
            'code': promo.code,
            'discount_type': promo.discount_type,
            'discount_value': str(promo.discount_value),
            'discount_amount': str(discount),
            'description': promo.description,
            'min_order_amount': str(promo.min_order_amount),
            'max_discount': str(promo.max_discount) if promo.max_discount else None,
        })


class ActivePromoCodesView(generics.ListAPIView):
    """
    Public endpoint — list active promo codes that users can see.
    Only returns codes that are currently valid.
    """
    permission_classes = [AllowAny]
    pagination_class = None

    def get(self, request):
        now = timezone.now()
        codes = PromoCode.objects.filter(
            is_active=True,
        ).exclude(
            valid_to__lt=now,
        )
        # Exclude usage-exceeded codes
        result = []
        for p in codes:
            if not p.is_usage_exceeded and p.is_started:
                result.append({
                    'code': p.code,
                    'description': p.description,
                    'discount_type': p.discount_type,
                    'discount_value': str(p.discount_value),
                    'min_order_amount': str(p.min_order_amount),
                    'max_discount': str(p.max_discount) if p.max_discount else None,
                    'valid_to': p.valid_to.isoformat() if p.valid_to else None,
                })
        return Response(result)


class LegalPageListView(generics.ListAPIView):
    """Public endpoint — list all published legal pages."""
    serializer_class = LegalPageListSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        return LegalPage.objects.filter(is_published=True)


class LegalPageDetailView(generics.RetrieveAPIView):
    """Public endpoint — get a single legal page by slug."""
    serializer_class = LegalPageDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'

    def get_queryset(self):
        return LegalPage.objects.filter(is_published=True)
