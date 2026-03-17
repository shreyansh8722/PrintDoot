from django.urls import path
from .views import (
    LegalPageListView, LegalPageDetailView,
    OfferListView, BannerListView,
    PromoCodeValidateView, ActivePromoCodesView,
)

urlpatterns = [
    path('offers/', OfferListView.as_view(), name='offer-list'),
    path('banners/', BannerListView.as_view(), name='banner-list'),
    path('promo-codes/', ActivePromoCodesView.as_view(), name='promo-code-list'),
    path('promo-codes/validate/', PromoCodeValidateView.as_view(), name='promo-code-validate'),
    path('', LegalPageListView.as_view(), name='legal-page-list'),
    path('<slug:slug>/', LegalPageDetailView.as_view(), name='legal-page-detail'),
]
