from django.test import TestCase
from rest_framework.test import APIClient
from .models import User

class SimpleTest(TestCase):
    def test_basic(self):
        client = APIClient()
        self.assertEqual(1, 1)
