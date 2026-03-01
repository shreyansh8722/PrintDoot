from django.urls import path
from .views import LegalPageListView, LegalPageDetailView

urlpatterns = [
    path('', LegalPageListView.as_view(), name='legal-page-list'),
    path('<slug:slug>/', LegalPageDetailView.as_view(), name='legal-page-detail'),
]
