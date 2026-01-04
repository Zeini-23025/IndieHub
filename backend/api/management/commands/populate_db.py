import random
from django.core.management.base import BaseCommand
from django.db import connection
from users.models import User
from games.models import Game, Category, Screenshot, Review
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

        # A full list of categories (name, description, name_ar, description_ar).
        # This mirrors how `game_titles` is defined above and makes the
        # seeding deterministic and easy to review.
        categories_data = [
            ('Action', 'High octane action games', 'أكشن', 'ألعاب حركة وإثارة'),
            ('Adventure', 'Explore new worlds', 'مغامرة', 'استكشاف عوالم جديدة'),
            ('RPG', 'Role playing games', 'تقمص الأدوار', 'ألعاب تقمص الأدوار'),
            ('Strategy', 'Test your tactical skills', 'استراتيجية', 'اختبر مهاراتك التكتيكية'),
            ('Puzzle', 'Solve complex puzzles', 'ألغاز', 'حل ألغاز معقدة'),
            ('Horror', 'Scary experiences', 'رعب', 'تجارب مخيفة'),
            ('Simulation', 'Realistic simulations', 'محاكاة', 'محاكاة واقعية'),
            ('Sports', 'Competitive sports games', 'رياضة', 'ألعاب رياضية تنافسية'),
            # entries from categories.json
            ('Clicker', 'Games focused on repeated clicking or incremental progress.', 'نقر', 'ألعاب تعتمد على النقر المتكرر أو التقدم التدريجي.'),
            ('Cute', 'Games with adorable visuals and characters.', 'لطيف', 'ألعاب تتميز برسومات وشخصيات لطيفة.'),
            ('Psychological Horror', 'Horror games focused on mental and emotional fear.', 'رعب نفسي', 'ألعاب رعب تعتمد على التوتر النفسي والعقلي.'),
            ('RPG Maker', 'Games created using RPG Maker engine.', 'صانع ألعاب RPG', 'ألعاب تم تطويرها باستخدام محرك RPG Maker.'),
            ('Short', 'Games with a short playtime experience.', 'قصير', 'ألعاب يمكن إنهاؤها في وقت لعب قصير.'),
            ('2D', 'Games with two-dimensional graphics.', 'ثنائي الأبعاد', 'ألعاب برسومات ثنائية الأبعاد.'),
            ('3D', 'Games with three-dimensional graphics.', 'ثلاثي الأبعاد', 'ألعاب برسومات ثلاثية الأبعاد.'),
            ('Singleplayer', 'Games designed for one player.', 'لاعب واحد', 'ألعاب مخصصة للعب الفردي.'),
            ('First-Person', 'Games played from the character\'s point of view.', 'منظور الشخص الأول', 'ألعاب تُلعب من منظور عين الشخصية.'),
            ('Tamagotchi', 'Virtual pet care and life simulation games.', 'حيوان أليف افتراضي', 'ألعاب تعتمد على رعاية كائن افتراضي.'),
            ('Furry', 'Games featuring anthropomorphic animal characters.', 'شخصيات حيوانية', 'ألعاب تحتوي على شخصيات حيوانية بشرية الصفات.'),
            ('Female Protagonist', 'Games with a female main character.', 'بطلة أنثى', 'ألعاب تكون فيها الشخصية الرئيسية أنثى.'),
            ('Fast-Paced', 'Games with quick action and high speed gameplay.', 'سريع الوتيرة', 'ألعاب تعتمد على السرعة وردة الفعل السريعة.'),
            ('Anime', 'Games inspired by anime art and style.', 'أنمي', 'ألعاب مستوحاة من أسلوب ورسومات الأنمي.'),
            ('Girl', 'Games focused on female characters or themes.', 'فتيات', 'ألعاب تركز على شخصيات أو مواضيع نسائية.'),
            ('Indie', 'Independently developed games.', 'مستقل', 'ألعاب تم تطويرها بشكل مستقل.'),
            ('Casual', 'Easy to play and relaxing games.', 'خفيف', 'ألعاب بسيطة ومريحة.'),
            ('Cult Classic', 'Games with a dedicated fanbase over time.', 'كلاسيكية محبوبة', 'ألعاب اكتسبت قاعدة جماهيرية مخلصة.'),
            ('Open Source', 'Games with publicly available source code.', 'مفتوح المصدر', 'ألعاب يكون كودها البرمجي متاحًا للعامة.'),
            ('Race', 'Games focused on racing competitions.', 'سباق', 'ألعاب تعتمد على سباقات تنافسية.'),
            ('Monsters', 'Games featuring monsters or creatures.', 'وحوش', 'ألعاب تحتوي على وحوش أو مخلوقات خيالية.'),
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

        # Check whether the many-to-many join table exists. If migrations
        # haven't been applied yet the M2M table won't exist and any
        # attempt to write to it will raise an OperationalError. In that
        # case we skip category assignment and continue populating other
        # sample data so the command is resilient to running order.
        existing_tables = connection.introspection.table_names()
        m2m_table_name = 'games_game_categories'
        has_m2m_table = m2m_table_name in existing_tables

        for i, (title, title_ar, desc, desc_ar) in enumerate(game_titles):
            developer = random.choice(devs)
            # assign 1-3 random categories per game
            num_cats = random.randint(1, min(3, len(categories)))
            selected_categories = random.sample(categories, num_cats)
            status = random.choice(
                ['approved', 'approved', 'approved', 'pending', 'rejected']
            )

            # Create or get the game without passing category.
            # M2M categories are handled below.
            game, created = Game.objects.get_or_create(
                title=title,
                defaults={
                    'title_ar': title_ar,
                    'description': desc,
                    'description_ar': desc_ar,
                    'developer': developer,
                    'status': status,
                    'file_path': 'games/dummy_game.zip'
                }
            )

            # Ensure the game's categories include the selected ones.
            # If the M2M table doesn't exist (migrations not applied yet),
            # skip category assignment to avoid OperationalError. This
            # makes the populate command safe to run before migrations.
            if has_m2m_table:
                # If the game was just created, set them. Otherwise add
                # missing ones.
                if created:
                    game.categories.set(selected_categories)
                else:
                    for cat in selected_categories:
                        game.categories.add(cat)
            else:
                self.stdout.write(self.style.WARNING(
                    f"Skipping category assignment for game '{title}' because table '{m2m_table_name}' does not exist."
                ))

            games.append(game)

            # Create dummy screenshots if game created
            # Ensure each game has up to 4 screenshots and one base image
            if created:
                # create 4 screenshots
                base_index = random.randint(0, 3)
                for j in range(4):
                    Screenshot.objects.create(
                        game=game,
                        image_path='screenshots/dummy_shot.jpg',
                        is_base=(j == base_index),
                    )

        # 4. Create Library Entries & Downloads for Approved Games
        self.stdout.write('Creating user interactions...')
        approved_games = [g for g in games if g.status == 'approved']

        if approved_games:
            for user in users:
                # Add random games to library
                num_games = random.randint(0, 5)
                selected_games = random.sample(
                    approved_games, min(num_games, len(approved_games))
                )

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

        # 5. Create Reviews for approved games (if the table exists)
        review_table = 'games_review'
        if review_table in existing_tables:
            self.stdout.write('Creating reviews for approved games...')
            sample_comments = [
                'Loved it!',
                'Pretty good, enjoyed the gameplay.',
                'Needs polishing but promising.',
                'Not my cup of tea.',
                'Fun with friends!',
                'Challenging and rewarding.'
            ]

            for game in approved_games:
                # create 0-5 reviews per approved game from distinct users
                num_reviews = random.randint(0, min(5, len(users)))
                if num_reviews == 0:
                    continue
                reviewers = random.sample(users, num_reviews)
                for reviewer in reviewers:
                    rating = random.randint(1, 5)
                    comment = random.choice(sample_comments)
                    # Use get_or_create to avoid violating unique_together
                    Review.objects.get_or_create(
                        game=game,
                        user=reviewer,
                        defaults={'rating': rating, 'comment': comment}
                    )
        else:
            self.stdout.write(
                self.style.WARNING(
                    (
                        "Skipping review creation because table '",
                        f"{review_table}",
                        "' does not exist."
                    )
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                'Successfully populated database with example data!'
            )
        )
