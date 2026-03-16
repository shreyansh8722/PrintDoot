from django.urls import path
from .views import LegalPageListView, LegalPageDetailView, OfferListView, BannerListView

urlpatterns = [
    path('offers/', OfferListView.as_view(), name='offer-list'),
    path('banners/', BannerListView.as_view(), name='banner-list'),
    path('', LegalPageListView.as_view(), name='legal-page-list'),
    path('<slug:slug>/', LegalPageDetailView.as_view(), name='legal-page-detail'),
]
