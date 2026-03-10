from django.urls import path
from .views import LegalPageListView, LegalPageDetailView, OfferListView

urlpatterns = [
    path('offers/', OfferListView.as_view(), name='offer-list'),
    path('', LegalPageListView.as_view(), name='legal-page-list'),
    path('<slug:slug>/', LegalPageDetailView.as_view(), name='legal-page-detail'),
]
