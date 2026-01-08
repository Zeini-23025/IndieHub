import os
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from games.models import Game
from .models import DownloadHistory

User = get_user_model()

class DownloadTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='user', email='u@u.com', password='p', role='user')
        self.dev = User.objects.create_user(username='dev', email='d@d.com', password='p', role='developer')
        
        # Create a game with a mock file
        self.game = Game.objects.create(
            title='Downloadable Game', title_ar='لعبة',
            description='Desc', description_ar='وصف',
            developer=self.dev, status='approved',
            file_path=SimpleUploadedFile('test_game.zip', b'dummy content')
        )

    def test_record_download_manually(self):
        url = reverse('downloads-list')
        data = {'game': self.game.id, 'device_info': 'Test Device'}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(DownloadHistory.objects.count(), 1)

    def test_download_game_endpoint(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('game-download', args=[self.game.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check if download was recorded
        self.assertEqual(DownloadHistory.objects.count(), 1)
        self.assertEqual(DownloadHistory.objects.get().user, self.user)

    def test_popular_games_list(self):
        # Create another game
        other_game = Game.objects.create(
            title='Less Popular', title_ar='لعبة',
            description='Desc', description_ar='وصف',
            developer=self.dev, status='approved'
        )
        
        # Record 2 downloads for self.game, 1 for other_game
        DownloadHistory.objects.create(game=self.game)
        DownloadHistory.objects.create(game=self.game)
        DownloadHistory.objects.create(game=other_game)
        
        url = reverse('popular-games-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['id'], self.game.id)
        self.assertEqual(response.data[1]['id'], other_game.id)

    def test_admin_list_and_delete_download(self):
        history = DownloadHistory.objects.create(game=self.game)
        admin = User.objects.create_superuser(username='admin_dl', email='a@dl.com', password='p', role='admin')
        self.client.force_authenticate(user=admin)
        
        # List
        url = reverse('downloads-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        
        # Delete
        url_detail = reverse('downloads-detail', args=[history.id])
        response = self.client.delete(url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(DownloadHistory.objects.count(), 0)
