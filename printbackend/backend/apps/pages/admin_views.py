from rest_framework import viewsets, permissions, filters
from .models import Offer
from .serializers import OfferSerializer
from apps.users.permissions import IsAdminOrStaff


class AdminOfferViewSet(viewsets.ModelViewSet):
    """
    Admin-only ViewSet for managing homepage marquee offers.
    """
    queryset = Offer.objects.all()
    serializer_class = OfferSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrStaff]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['text']
    ordering_fields = ['display_order', 'created_at']
    ordering = ['display_order', '-created_at']
