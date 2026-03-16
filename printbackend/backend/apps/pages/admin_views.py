from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Offer, Banner
from .serializers import OfferSerializer, BannerSerializer
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


class AdminBannerViewSet(viewsets.ModelViewSet):
    """
    Admin-only ViewSet for managing banners / hero images.
    """
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrStaff]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'subtitle', 'position']
    ordering_fields = ['display_order', 'created_at', 'position']
    ordering = ['position', 'display_order', '-created_at']

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """
        Bulk reorder banners. Expects: { "order": [{ "id": 1, "display_order": 0 }, ...] }
        """
        order_data = request.data.get('order', [])
        for item in order_data:
            Banner.objects.filter(id=item.get('id')).update(display_order=item.get('display_order', 0))
        return Response({'status': 'Banners reordered successfully'})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get banner statistics."""
        from django.utils import timezone
        now = timezone.now()
        total = Banner.objects.count()
        active = Banner.objects.filter(is_active=True).count()
        scheduled = Banner.objects.filter(start_date__gt=now).count()
        expired = Banner.objects.filter(end_date__lt=now, end_date__isnull=False).count()

        # Count by position
        position_counts = {}
        for choice_val, choice_label in Banner.POSITION_CHOICES:
            position_counts[choice_val] = Banner.objects.filter(position=choice_val, is_active=True).count()

        return Response({
            'total': total,
            'active': active,
            'inactive': total - active,
            'scheduled': scheduled,
            'expired': expired,
            'by_position': position_counts,
        })
