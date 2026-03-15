from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import User, Address

class UserApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('user-register') # /api/users/register/
        self.address_list_url = reverse('address-list') # /api/addresses/

    def test_registration(self):
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'securepassword123',
            'company_name': 'Test Corp'
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().company_name, 'Test Corp')

    def test_address_management(self):
        # Create user & login
        user = User.objects.create_user(username='john', password='password')
        self.client.force_authenticate(user=user)
        
        # Create Address
        data = {
            'type': 'shipping',
            'recipient_name': 'John Doe',
            'street': '123 Main St',
            'city': 'New York',
            'zip_code': '10001',
            'country': 'USA',
            'phone_number': '555-0199'
        }
        response = self.client.post(self.address_list_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Address.objects.count(), 1)
        self.assertEqual(Address.objects.get().user, user)
