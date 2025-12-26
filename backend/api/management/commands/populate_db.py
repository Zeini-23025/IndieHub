import os
import random
from django.core.management.base import BaseCommand
from users.models import User
from games.models import Game, Category, Screenshot
from library.models import LibraryEntry
from downloads.models import DownloadHistory

class Command(BaseCommand):
    help = 'Populates the database with example data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Populating database...')

        # 1. Create Users
        self.stdout.write('Creating users...')
        
        # Admin
        admin, _ = User.objects.get_or_create(
            username='admin',
            email='admin@indiehub.com',
            defaults={
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True
            }
        )
        admin.set_password('admin123')
        admin.save()

        # Developers
        devs = []
        for i in range(1, 6):
            dev, _ = User.objects.get_or_create(
                username=f'developer{i}',
                email=f'dev{i}@indiehub.com',
                defaults={'role': 'developer'}
            )
            dev.set_password(f'dev{i}123')
            dev.save()
            devs.append(dev)

        # Users
        users = []
        for i in range(1, 11):
            user, _ = User.objects.get_or_create(
                username=f'player{i}',
                email=f'player{i}@indiehub.com',
                defaults={'role': 'user'}
            )
            user.set_password(f'player{i}123')
            user.save()
            users.append(user)

        # 2. Create Categories
        self.stdout.write('Creating categories...')
        categories_data = [
            ('Action', 'High octane action games', 'أكشن', 'ألعاب حركة وإثارة'),
            ('Adventure', 'Explore new worlds', 'مغامرة', 'استكشاف عوالم جديدة'),
            ('RPG', 'Role playing games', 'تقمص الأدوار', 'ألعاب تقمص الأدوار'),
            ('Strategy', 'Test your tactical skills', 'استراتيجية', 'اختبر مهاراتك التكتيكية'),
            ('Puzzle', 'Solve complex puzzles', 'ألغاز', 'حل ألغاز معقدة'),
            ('Horror', 'Scary experiences', 'رعب', 'تجارب مخيفة'),
            ('Simulation', 'Realistic simulations', 'محاكاة', 'محاكاة واقعية'),
            ('Sports', 'Competitive sports games', 'رياضة', 'ألعاب رياضية تنافسية'),
        ]

        categories = []
        for name, desc, name_ar, desc_ar in categories_data:
            cat, _ = Category.objects.get_or_create(
                name=name,
                defaults={
                    'description': desc,
                    'name_ar': name_ar,
                    'description_ar': desc_ar
                }
            )
            categories.append(cat)

        # 3. Create Games
        self.stdout.write('Creating games...')
        game_titles = [
            ('Desert Storm', 'عاصفة الصحراء', 'Survive the harsh desert environments.', 'النجاة في بيئات الصحراء القاسية.'),
            ('Space Mystery', 'لغز الفضاء', 'Find the truth among the stars.', 'اكتشف الحقيقة بين النجوم.'),
            ('Ancient Legend', 'أسطورة قديمة', 'Explore ancient ruins and myths.', 'استكشف الآثار والأساطير القديمة.'),
            ('City Racer', 'متسابق المدينة', 'High speed racing in Tokyo.', 'سباق عالي السرعة في طوكيو.'),
            ('Shadow Ninja', 'ظل النينجا', 'Stealth and precision.', 'تسلل ودقة.'),
            ('Pixel Kingdom', 'مملكة البكسل', 'Build your own kingdom.', 'ابني مملكتك الخاصة.'),
            ('Cyber Hack', 'اختراق سيبراني', 'Hacking simulation game.', 'لعبة محاكاة الاختراق.'),
            ('Farm Life', 'حياة المزرعة', 'Relaxing farming sim.', 'محاكاة زراعة مريحة.'),
            ('Zombie Outbreak', 'تفشي الزومبي', 'Survival horror game.', 'لعبة رعب وبقاء.'),
            ('Chess Master', 'أستاذ الشطرنج', 'Classic chess with AI.', 'شطرنج كلاسيكي مع ذكاء اصطناعي.'),
            ('Galactic War', 'حرب المجرات', 'Space strategy game.', 'لعبة استراتيجية الفضاء.'),
            ('Hidden Objects', 'أشياء مخفية', 'Find hidden items.', 'ابحث عن العناصر المخفية.'),
            ('Math Whiz', 'عبقري الرياضيات', 'Educational math game.', 'لعبة رياضيات تعليمية.'),
            ('Cooking Chef', 'الطاهي المحترف', 'Restaurant management.', 'إدارة مطعم.'),
            ('Tower Defense', 'الدفاع عن البرج', 'Defend your base.', 'دافع عن قاعدتك.')
        ]

        games = []
        for i, (title, title_ar, desc, desc_ar) in enumerate(game_titles):
            developer = random.choice(devs)
            category = random.choice(categories)
            status = random.choice(['approved', 'approved', 'approved', 'pending', 'rejected'])
            
            game, created = Game.objects.get_or_create(
                title=title,
                defaults={
                    'title_ar': title_ar,
                    'description': desc,
                    'description_ar': desc_ar,
                    'developer': developer,
                    'category': category,
                    'status': status,
                    'file_path': 'games/dummy_game.zip'
                }
            )
            games.append(game)
            
            # Create dummy screenshots if game created
            if created:
                for j in range(random.randint(1, 3)):
                    Screenshot.objects.create(
                        game=game,
                        image_path='screenshots/dummy_shot.jpg'
                    )

        # 4. Create Library Entries & Downloads for Approved Games
        self.stdout.write('Creating user interactions...')
        approved_games = [g for g in games if g.status == 'approved']
        
        if approved_games:
            for user in users:
                # Add random games to library
                num_games = random.randint(0, 5)
                selected_games = random.sample(approved_games, min(num_games, len(approved_games)))
                
                for game in selected_games:
                    LibraryEntry.objects.get_or_create(user=user, game=game)
                    
                    # Randomly add download history
                    if random.choice([True, False]):
                        DownloadHistory.objects.create(
                            game=game,
                            user=user,
                            device_info='Windows PC',
                            ip_address=f'192.168.1.{random.randint(1, 255)}'
                        )

        self.stdout.write(self.style.SUCCESS('Successfully populated database with example data!'))
