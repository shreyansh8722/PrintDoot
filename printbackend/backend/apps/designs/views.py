from rest_framework import viewsets, permissions, filters
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import SavedDesign, Asset, Template, Font
from .serializers import SavedDesignSerializer, AssetSerializer, TemplateSerializer, FontSerializer

class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user

class SavedDesignViewSet(viewsets.ModelViewSet):
    """
    CRUD for a user's designs.
    """
    serializer_class = SavedDesignSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['updated_at', 'name']

    def get_queryset(self):
        return self.request.user.designs.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class AssetViewSet(viewsets.ModelViewSet):
    """
    Asset uploads (Images, Logos).
    """
    serializer_class = AssetSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    parser_classes = [MultiPartParser, FormParser] # Allow file uploads

    def get_queryset(self):
        return self.request.user.assets.all()

    def perform_create(self, serializer):
        # Auto-extract metadata (size, mime) could happen here or in signals
        serializer.save(user=self.request.user)

class TemplateViewSet(viewsets.ModelViewSet):
    queryset = Template.objects.filter(is_active=True).prefetch_related('elements')
    serializer_class = TemplateSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'subcategory__name', 'tags']

class FontViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Font.objects.filter(is_active=True)
    serializer_class = FontSerializer
    permission_classes = [permissions.AllowAny]
