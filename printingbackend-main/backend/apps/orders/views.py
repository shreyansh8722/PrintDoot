from rest_framework import viewsets, permissions, filters
from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderItemSerializer

class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user

class OrderViewSet(viewsets.ModelViewSet):
    """
    Full Order lifecycle.
    Create: Checkout process (snapshots prices/designs).
    List: Order history.
    """
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'total_amount']

    def get_queryset(self):
        return self.request.user.orders.prefetch_related('items__product', 'shipment').all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
