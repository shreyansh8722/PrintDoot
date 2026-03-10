from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import LegalPage, Offer
from .serializers import LegalPageListSerializer, LegalPageDetailSerializer, OfferSerializer


class OfferListView(generics.ListAPIView):
    """Public endpoint — list all active offers for the marquee."""
    serializer_class = OfferSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        return Offer.objects.filter(is_active=True)


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
