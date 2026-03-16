from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import LegalPage, Offer, Banner
from .serializers import LegalPageListSerializer, LegalPageDetailSerializer, OfferSerializer, BannerSerializer
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
