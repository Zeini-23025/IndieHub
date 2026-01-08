from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

User = get_user_model()

class UserTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('user-register')
        self.login_url = reverse('user-login')
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpassword123',
            'role': 'user'
        }

    def test_registration(self):
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().username, 'testuser')
        self.assertEqual(User.objects.get().role, 'user')

    def test_registration_as_developer(self):
        data = self.user_data.copy()
        data['username'] = 'devuser'
        data['role'] = 'developer'
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.get(username='devuser').role, 'developer')

    def test_login(self):
        # Register first
        self.client.post(self.register_url, self.user_data)
        
        # Login
        login_data = {'username': 'testuser', 'password': 'testpassword123'}
        response = self.client.post(self.login_url, login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

    def test_login_invalid_credentials(self):
        login_data = {'username': 'testuser', 'password': 'wrongpassword'}
        response = self.client.post(self.login_url, login_data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_list_unauthorized(self):
        # Regular users shouldn't list users
        url = reverse('user-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_list_admin_authorized(self):
        # Create admin
        admin = User.objects.create_superuser(username='admin', email='a@a.com', password='p', role='admin')
        self.client.force_authenticate(user=admin)
        
        url = reverse('user-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_user_detail_and_update(self):
        # Register user
        self.client.post(self.register_url, self.user_data)
        user = User.objects.get(username='testuser')
        self.client.force_authenticate(user=user)
        
        url = reverse('user-detail', args=[user.id])
        
        # Get detail
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Update email
        response = self.client.patch(url, {'email': 'new@example.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertEqual(user.email, 'new@example.com')

    def test_logout(self):
        # Register and login
        self.client.post(self.register_url, self.user_data)
        login_data = {'username': 'testuser', 'password': 'testpassword123'}
        login_res = self.client.post(self.login_url, login_data)
        token = login_res.data['token']
        
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token)
        url = reverse('user-logout')
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify token is deleted
        from rest_framework.authtoken.models import Token
        self.assertFalse(Token.objects.filter(key=token).exists())
