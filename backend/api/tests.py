from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

class WelcomeTests(APITestCase):
    def test_welcome_endpoint(self):
        url = '/api/welcome/' # Manually defined in root urls.py
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], "Welcome to the IndieHub API!")
