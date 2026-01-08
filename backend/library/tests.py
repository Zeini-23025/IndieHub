from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from games.models import Game
from .models import LibraryEntry

User = get_user_model()

class LibraryTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='user', email='u@u.com', password='p', role='user')
        self.other_user = User.objects.create_user(username='other', email='o@o.com', password='p', role='user')
        self.dev = User.objects.create_user(username='dev', email='d@d.com', password='p', role='developer')
        
        self.game = Game.objects.create(
            title='In Library', title_ar='لعبة',
            description='Desc', description_ar='وصف',
            developer=self.dev, status='approved'
        )

    def test_add_to_library(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('libraryentry-list')
        data = {'game': self.game.id}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(LibraryEntry.objects.count(), 1)
        self.assertEqual(LibraryEntry.objects.get().user, self.user)

    def test_list_my_library(self):
        LibraryEntry.objects.create(user=self.user, game=self.game)
        LibraryEntry.objects.create(user=self.other_user, game=self.game)
        
        self.client.force_authenticate(user=self.user)
        url = reverse('libraryentry-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1) # Only my entries

    def test_remove_from_library(self):
        entry = LibraryEntry.objects.create(user=self.user, game=self.game)
        self.client.force_authenticate(user=self.user)
        url = reverse('libraryentry-detail', args=[entry.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(LibraryEntry.objects.count(), 0)
