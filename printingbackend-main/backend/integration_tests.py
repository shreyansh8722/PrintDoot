from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.catalog.models import Category, Product
from apps.users.models import User

class IntegrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='password')
        self.category = Category.objects.create(name='Business Cards', slug='business-cards')
        self.product = Product.objects.create(
            category=self.category,
            name='Standard Card',
            slug='standard-card',
            base_price=10.00,
            sku='BC-001'
        )

    def test_catalog_list(self):
        url = '/api/products/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Standard Card')

        # Create Address
        from apps.users.models import Address
        self.address = Address.objects.create(
            user=self.user,
            type='shipping',
            recipient_name='Test User',
            street='123 Test St',
            city='Test City',
            zip_code='12345',
            country='Test Country'
        )

    def test_order_creation(self):
        from apps.users.models import Address
        address = Address.objects.create(
            user=self.user,
            type='shipping',
            recipient_name='Test User',
            street='123 Test St',
            city='Test City',
            zip_code='12345',
            country='Test Country'
        )

        self.client.force_authenticate(user=self.user)
        url = '/api/orders/'
        data = {
            'shipping_address': address.id,
            'items': [
                {'product': self.product.id, 'quantity': 500}
            ]
        }
        response = self.client.post(url, data, format='json')
        if response.status_code != status.HTTP_201_CREATED:
            print("ORDER CREATION FAILED:", response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(float(response.data['subtotal']), 5000.00)
