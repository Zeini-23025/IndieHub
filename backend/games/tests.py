import io
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from .models import Game, Category, Review

User = get_user_model()

class GameTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(username='admin', email='a@a.com', password='p', role='admin')
        self.dev = User.objects.create_user(username='dev', email='d@d.com', password='p', role='developer')
        self.user = User.objects.create_user(username='user', email='u@u.com', password='p', role='user')
        
        self.category = Category.objects.create(name='Action', name_ar='أكشن')
        self.game_data = {
            'title': 'Test Game',
            'title_ar': 'لعبة تجريبية',
            'description': 'Description',
            'description_ar': 'وصف',
            'category_ids': [self.category.id],
            'file_path': SimpleUploadedFile('game.zip', b'file_content', content_type='application/zip')
        }

    def test_create_game_as_developer(self):
        self.client.force_authenticate(user=self.dev)
        url = reverse('game-list') # ViewSet create
        response = self.client.post(url, self.game_data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Game.objects.count(), 1)
        self.assertEqual(Game.objects.get().status, 'pending')

    def test_approve_game_as_admin(self):
        game = Game.objects.create(
            title='Pending Game', title_ar='لعبة',
            description='Desc', description_ar='وصف',
            developer=self.dev, status='pending'
        )
        self.client.force_authenticate(user=self.admin)
        url = reverse('game-detail', args=[game.id])
        response = self.client.patch(url, {'status': 'approved'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        game.refresh_from_db()
        self.assertEqual(game.status, 'approved')

    def test_public_game_list_shows_only_approved(self):
        Game.objects.create(title='App', title_ar='أ', description='D', description_ar='و', developer=self.dev, status='approved')
        Game.objects.create(title='Pen', title_ar='ب', description='D', description_ar='و', developer=self.dev, status='pending')
        
        url = reverse('game-list-list') # ReadOnly ViewSet list
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_home_sections_api(self):
        # Create approved games
        Game.objects.create(title='G1', title_ar='ا', description='D', description_ar='و', developer=self.dev, status='approved')
        
        url = reverse('game-home-sections')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('most_popular', response.data)
        self.assertIn('new_releases', response.data)
        self.assertIn('top_rated', response.data)

    def test_review_game(self):
        game = Game.objects.create(title='G1', title_ar='ا', description='D', description_ar='و', developer=self.dev, status='approved')
        self.client.force_authenticate(user=self.user)
        url = reverse('review-list')
        review_data = {
            'game': game.id,
            'rating': 5,
            'comment': 'Amazing!'
        }
        response = self.client.post(url, review_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Review.objects.count(), 1)

    def test_category_crud_admin(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('category-list')
        # Create
        response = self.client.post(url, {'name': 'RPG', 'name_ar': 'ار بي جي', 'description': 'desc', 'description_ar': 'وصف'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        cat_id = response.data['id']
        
        # Update
        url_detail = reverse('category-detail', args=[cat_id])
        response = self.client.patch(url_detail, {'name': 'New RPG'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Delete
        response = self.client.delete(url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_screenshot_upload(self):
        game = Game.objects.create(title='G1', title_ar='ا', description='D', description_ar='و', developer=self.dev, status='approved')
        self.client.force_authenticate(user=self.dev)
        url = reverse('screenshot-list')
        # 1x1 pixel GIF
        img_content = b'GIF89a\x01\x00\x01\x00\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x01D\x00;'
        img = SimpleUploadedFile('shot.gif', img_content, content_type='image/gif')
        response = self.client.post(url, {'game': game.id, 'image_path': img, 'is_base': True}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
    def test_analytics_endpoints(self):
        self.client.force_authenticate(user=self.admin)
        urls = [
            reverse('analytics-downloads'),
            reverse('analytics-ratings-average'),
            reverse('analytics-ratings-distribution')
        ]
        for url in urls:
            response = self.client.get(url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_public_readonly_lists(self):
        # Category list
        url = reverse('category-list-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Screenshot list
        url = reverse('screenshot-list-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
