from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import Address
from .serializers import UserSerializer, AddressSerializer
from .permissions import IsAdminOrStaff

User = get_user_model()

class AdminUserViewSet(viewsets.ModelViewSet):
    """
    Admin-only ViewSet for managing all users.
    """
    queryset = User.objects.all().select_related('role').prefetch_related('addresses')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrStaff]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email', 'company_name', 'first_name', 'last_name']
    ordering_fields = ['date_joined', 'username', 'email']
    ordering = ['-date_joined']

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a user account"""
        user = self.get_object()
        user.is_active = False
        user.save()
        return Response({'status': 'User deactivated'})

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a user account"""
        user = self.get_object()
        user.is_active = True
        user.save()
        return Response({'status': 'User activated'})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get user statistics"""
        from django.utils import timezone
        from datetime import timedelta

        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        today = timezone.now().date()
        users_today = User.objects.filter(date_joined__date=today).count()
        users_this_week = User.objects.filter(
            date_joined__gte=timezone.now() - timedelta(days=7)
        ).count()

        return Response({
            'total': total_users,
            'active': active_users,
            'today': users_today,
            'this_week': users_this_week,
        })
