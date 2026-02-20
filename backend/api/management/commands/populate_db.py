import random
import os
from django.core.files import File
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
        # Profile images directory
        profiles_dir = os.path.join(os.path.dirname(__file__), 'profiles')
        profile_images = []
        if os.path.isdir(profiles_dir):
            profile_images = [
                os.path.join(profiles_dir, f) 
                for f in os.listdir(profiles_dir) 
                if f.lower().endswith(('.png', '.jpg', '.jpeg'))
            ]

        for i in range(1, 11):
            user, created = User.objects.get_or_create(
                username=f'player{i}',
                email=f'player{i}@indiehub.com',
                defaults={'role': 'user'}
            )
            user.set_password(f'player{i}123')
            
            if created and profile_images:
                try:
                    image_path = random.choice(profile_images)
                    with open(image_path, 'rb') as f:
                        user.profile_image.save(
                            os.path.basename(image_path),
                            File(f),
                            save=False
                        )
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'Failed to set profile image for {user.username}: {e}'))

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

        categories = {}
        for name, desc, name_ar, desc_ar in categories_data:
            cat, _ = Category.objects.get_or_create(
                name=name,
                defaults={
                    'description': desc,
                    'name_ar': name_ar,
                    'description_ar': desc_ar
                }
            )
            categories[name] = cat

        # 3. Create Games
        self.stdout.write('Creating games...')
        
        # Define your specific games with their categories
        game_titles = [
            {
                'title': 'BLACK SOULS',
                'title_ar': 'الأرواح السوداء',
                'description': '''Long, long ago, there existed a kingdom shrouded in dense mist: the Lost Empire.
This mist twisted humans into terrifying beasts, plunging the world into despair.
War raged endlessly.
Heroes rose, seeking fame and glory.
Courtesans dreamt of royal ballroom dances.
Treasures lay hidden within secret gardens.
All gathered here, only to vanish into obscurity.
It is in this place you awaken—
a nameless undead.
As the protagonist of this grim tale, what will you witness, and what will you gain?
May you avoid meeting the darkest of ends…
Features:
• Highly open-ended exploration in an open world.
• Selectable player class.
• Symbol Encounter system.
• Tense Active-Time Battle (ATB) system.
• 21 heroines based on famous fairy tales (Alice in Wonderland, Snow White, Little Red Riding Hood, etc.).
• Multiple endings.
• Death does not result in a Game Over.''',
                'description_ar': '''منذ زمنٍ بعيد، بعيد جدًا، وُجدت مملكة يلفّها ضباب كثيف: الإمبراطورية الضائعة.
كان هذا الضباب يشوّه البشر، محوّلًا إياهم إلى وحوش مرعبة، ويغرق العالم في اليأس.
اندلعت الحروب بلا نهاية.
نهض الأبطال سعيًا وراء المجد والشهرة.
حلمت الوصيفات برقصات القصور الملكية.
واختبأت الكنوز في حدائق سرّية.
اجتمع الجميع هنا… ثم تلاشى ذكرهم في غياهب النسيان.
وفي هذا المكان تستيقظ أنت—
ميتٌ حي بلا اسم.
بصفتك بطل هذه الحكاية القاتمة، ماذا ستشهد؟
وماذا ستكسب؟
عسى أن تنجو من مواجهة أكثر النهايات ظلمة…
المميزات:
• استكشاف مفتوح للغاية في عالم واسع.
• اختيار فئة الشخصية (Class).
• نظام مواجهات الرموز.
• نظام قتال متوتر بنمط الوقت النشط (ATB).
• 21 بطلة مستوحاة من أشهر الحكايات الخيالية
• نهايات متعددة.
• الموت لا يؤدي إلى انتهاء اللعبة.''',
                'categories': ['Adventure', 'Anime', 'Horror', 'Singleplayer']
            },
            {
                'title': 'Bloodmoney',
                'title_ar': 'أموال الدم',
                'description': '''HOW FAR WOULD YOU GO FOR MONEY?
You're struck with a serious condition and the only treatment available is an expensive operation. $25,000, to be exact. How are you going to get that money in time? It seems hopeless. Dire, even.
But then, BOOM! THERE HE IS! THERE IS HARVEY HARVINGTON! IN A STALL ON THE SIDE OF THE ROAD! $1 IN EXCHANGE FOR JUST ONE CLICK! THAT'S THE DEAL OF A LIFETIME!
"Really?" YES! "How much will he give me?" AS MUCH AS YOU CAN CLICK HIM FOR! "Can he give me more?" YEAH~!
Sure, $1 per click is good, but how about $2? $4? $8? All you need to do is hurt him! Needles, hammers, scissors, whatever! The more pain you inflict on him, the more money you'll get! The question now isn't "how much will he give you" so much as it is "how much can I make him fork over?"! The only limit is your sanity, as well as Harvey's life force!
COMES WITH:
• 3 ENDINGS!
• Cute pastel art!
• 30+ minutes of clicking fun!
• A TON OF MONEY!
• The knowledge you ruined the life of an innocent man who only wanted to bring some of his good and generosity into the world!!!
• A COOL SONG!
WHAT ARE YOU WAITING FOR??? GET HARVEY'S 1-DOLLAR-PER-CLICK PACKAGE TODAY!!''',
                'description_ar': '''إلى أي مدى قد تذهب من أجل المال؟
تصاب بحالة خطيرة، والعلاج الوحيد المتاح هو عملية جراحية باهظة الثمن. 25,000 دولار بالضبط. كيف ستحصل على هذا المبلغ في الوقت المناسب؟ يبدو الأمر ميؤوسًا منه… بل كارثيًا.
لكن فجأة—بووم! ها هو ذا! هارفـي هارفنغتون!
في كشك على جانب الطريق! دولار واحد مقابل نقرة واحدة فقط! إنها صفقة العمر!
«حقًا؟» نعم!
«كم سيعطيني؟» بقدر ما تستطيع أن تنقر عليه!
«هل يمكنه أن يعطيني أكثر؟» نعم~!
صحيح أن دولارًا واحدًا لكل نقرة جيد، لكن ماذا عن دولارين؟ أربعة؟ ثمانية؟
كل ما عليك فعله هو إيذاؤه! إبر، مطارق، مقصات—أي شيء!
كلما زاد الألم الذي تُلحقه به، زاد المال الذي ستحصل عليه!
لم يعد السؤال الآن «كم سيعطيك؟» بقدر ما هو «كم يمكنك أن تجعله يدفع؟!»
الحدّ الوحيد هو سلامتك العقلية… وكذلك قوة حياة هارفي!
يتضمن:
• 3 نهايات!
• فن لطيف بألوان باستيلية!
• أكثر من 30 دقيقة من متعة النقر!
• كمية هائلة من المال!
• معرفة أنك دمّرت حياة رجل بريء لم يرد سوى نشر بعض الخير والكرم في العالم!!!
• أغنية رائعة!
فماذا تنتظر؟؟؟ احصل على باقة "هارفي: دولار لكل نقرة" اليوم!!''',
                'categories': ['Clicker', 'Cute', 'Horror', 'Psychological Horror', 'Short']
            },
            {
                'title': 'Jenny Game',
                'title_ar': 'جيني',
                'description': '''Jenny Jeungman's little town buckles under bureaucracy and post-lapinist architecture more aligned with the tastes of demons than rabbits. Now she's caught in a system that rewrites reality and it's up to HER (you) to stop this lunacy!
Say hi, Jenny!
Die.
GAMEPLAY
Put on your HAT, swing your bat and steal every gun you see. Fight demons, ghosts, salarymen, and bureaucracy itself in this manic hat-and-bat twin-stick shooter. If it breathes, it breaks.
Every weapon is yours, the only the limit is your two opposable thumbs: Pistols, shotguns, chainsaws, grenade launchers, mine layers, flamethrowers, and who knows what else!
ENEMIES
The demo alone has 19 unique enemies. Honestly I'm creeped out by how fine they are living under a demonic directorate, but the ghosts are pretty spooky too!
• Sardine Salarymen filling your suffering in triplicate.
• Skating Punk Skunks who shred rails and crack skulls just as hard as you do.
• Tonguey Ghosts that lick you senseless and possess all items of affection.
• Infernal Express, a giant flaming train boss powered by demonic anger and the anxiety of missed schedules.
And plenty more, the Office of Hostile Affairs has... unlimited budget
LEVELS
Blast through levels in the underworld brutalism of the Current Network subway, the deranged wilds of Steelwood Sticks and... that's all for the demo, but THERE WILL BE MORE!
Each level can be replayed under kafkaesque Edicts - tribunal rules that twist reality, like making enemies explode, doubling projectiles or even making it rain indoors.
Push into Jenny's world not by grinding resources, but by getting good.''',
                'description_ar': '''مدينة جيني جونغمان الصغيرة تنهار تحت وطأة البيروقراطية وعمارة ما بعد "اللابينية"، عمارة أقرب لذوق الشياطين منها للأرانب. الآن وجدت نفسها عالقة في نظام يعيد كتابة الواقع، والأمر متروك لها (لك أنت) لإيقاف هذا الجنون!
قولي مرحبًا، يا جيني!
… مت.
الأعداء (ENEMIES)
النسخة التجريبية وحدها تضم 19 عدوًا فريدًا. بصراحة، الأمر مخيف كم هم متأقلمون مع العيش تحت إدارة شيطانية… لكن الأشباح مخيفة فعلًا أيضًا!
• موظفو السردين الذين يملؤون معاناتك بنماذج ثلاثية النسخ.
• ظربان بانك متزلجون يسحقون القضبان ويكسرون الجماجم بنفس القوة.
• أشباح ذات ألسنة تلعقك حتى تفقد السيطرة وتستحوذ على كل ما تحبه.
• القطار الجهنمي السريع: زعيم ضخم، قطار مشتعل يعمل بالغضب الشيطاني وقلق المواعيد الفائتة.
والمزيد غير ذلك… مكتب الشؤون العدائية لديه ميزانية غير محدودة.
المراحل (LEVELS)
اقتحم المراحل في وحشية العالم السفلي لمحطات مترو "الشبكة الحالية"، وفي البراري المجنونة لغابات Steelwood Sticks…
وهذا كل ما في النسخة التجريبية، لكن سيكون هناك المزيد!
يمكن إعادة لعب كل مرحلة تحت مراسيم كافكوية—قوانين محاكم تغيّر الواقع، مثل جعل الأعداء ينفجرون، مضاعفة المقذوفات، أو حتى جعل المطر يهطل داخل المباني.
تقدّم في عالم جيني ليس بجمع الموارد، بل بإتقان اللعب.''',
                'categories': ['2D', 'Fast-Paced', 'Female Protagonist', 'Furry']
            },
            {
                'title': 'MISIDE',
                'title_ar': 'الجانب الخفي',
                'description': '''Let's imagine that you have a game in which you care for a character.
But could you imagine one day getting into that game yourself?
MiSide is an adventure game with horror elements, telling the story of a simple guy who, for mystical reasons, finds himself in a mobile simulation. Appearing in the house he has just observed on his smartphone screen, the hero becomes confused. The stunned guy follows the instructions of a certain device he discovered in the bedroom. A few moments later, he is greeted by a pretty girl, whose image is also familiar to the young man from this mobile game.''',
                'description_ar': '''هي لعبة مغامرات بعناصر رعب، تروي قصة شاب بسيط يجد نفسه، لأسباب غامضة، داخل محاكاة على هاتف محمول. يظهر البطل داخل المنزل الذي كان يراقبه قبل لحظات على شاشة هاتفه، فيشعر بالارتباك والذهول.
يتبع الشاب المصدوم تعليمات جهاز غريب يعثر عليه في غرفة النوم. وبعد فترة قصيرة، تستقبله فتاة جميلة، تبدو صورتها مألوفة له أيضًا، إذ سبق أن رآها في تلك اللعبة المحمولة.''',
                'categories': ['3D', 'Anime', 'First-Person', 'Girl', 'Horror', 'Singleplayer', 'Tamagotchi']
            },
            {
                'title': 'Petsitting',
                'title_ar': 'جليسة الحيوانات',
                'description': '''Your friend is gone for the weekend and has left you in charge of their beloved family pet. Despite the name, dog is a giant worm who hates life as a domestic housepet. Take care of dog, and hopefully you will end up on his good side.
Controls:
• Movement: W, A, S, D
• Interaction: E (in first person), LMB (when camera fixed)
• Pause: Esc
Length approx. 15 minutes
Original worm model created by Joachim Bornemann''',
                'description_ar': '''صديقك غادر لقضاء عطلة نهاية الأسبوع وقد تركك مسؤولًا عن حيوانه الأليف المحبوب. رغم الاسم، إلا أن "الكلب" هو في الواقع دودة ضخمة تكره الحياة كحيوان أليف في المنزل. اعتنِ بالكلب، وأمل أن تنجح في كسب رضاه.
التحكم:
• الحركة: W, A, S, D
• التفاعل: E (في الوضع الشخصي الأول)، LMB (عند تثبيت الكاميرا)
• إيقاف: Esc
مدة اللعبة: تقريبا 15 دقيقة''',
                'categories': ['3D', 'First-Person', 'Horror', 'Indie', 'Psychological Horror', 'Short', 'Singleplayer']
            },
            {
                'title': 'Sacrifices Must Be Made',
                'title_ar': 'يجب أن تُقدّم التضحيات',
                'description': '''You find yourself in a dimly lit log cabin in the middle of the woods. You are starving to death. The stranger who resides there tells you that he will feed you if you defeat him in a game of cards.
Sacrifices Must Be Made is a game created for Ludum Dare 43. I produced the game code, art, and audio in 48 hours.
The game should take around 10-15 minutes to complete. There is an ending so hang in there!
Controls:
• Mouse - Move Cursor and Click
• WASD/Arrow Keys - Shift Camera View
• SHIFT+R - Reset Level''',
                'description_ar': '''تجد نفسك في كوخ خشبي شبه مظلم في وسط الغابة. أنت على وشك الموت جوعًا. يخبرك الغريب الذي يقيم هناك أنه سيوفر لك الطعام إذا هزمتَه في لعبة ورق.
"يجب أن تُقدّم التضحيات" هي لعبة تم إنشاؤها ضمن Ludum Dare 43. لقد قمت بتطوير الكود والفن والصوت في 48 ساعة فقط.
الوقت الذي ستحتاجه لإكمال اللعبة هو حوالي 10-15 دقيقة. هناك نهاية، لذا استمر في اللعب!
التحكم:
• الفأرة: تحريك المؤشر والنقر
• WASD/مفاتيح الأسهم: تغيير زاوية الكاميرا
• SHIFT+R: إعادة ضبط المستوى''',
                'categories': ['Indie', 'Singleplayer']
            },
            {
                'title': 'Karts. Nitro. Action',
                'title_ar': 'سيارات كارت. نيترو. حركة',
                'description': '''SuperTuxKart is a multi-platform 3D Open Source arcade kart racer with a wide variety of tracks, characters and game modes.
Play the Story Mode and defeat the evil Nolok, challenge players from all around the world playing online, have fun with up to 8 friends playing together on one PC, explore tracks in egg hunts, challenge yourself in time-trials, race in our official tracks or in hundreds of addons... The choice is yours!
All the standard SuperTuxKart 1.5 packages are available free of charge. Donators can get early access to two extra tracks developed for SuperTuxKart Evolution, the sequel our team is now working on.''',
                'description_ar': '''SuperTuxKart هي لعبة سباق كارت 3D مفتوحة المصدر متعددة المنصات، مع مجموعة واسعة من الحلبات والشخصيات وأنماط اللعب.
العب في وضع القصة وهزّم الشرير نولوك، تحدَّ اللاعبين من جميع أنحاء العالم في اللعب عبر الإنترنت، استمتع باللعب مع ما يصل إلى 8 أصدقاء على جهاز واحد، استكشف الحلبات في بحث البيض، تحدَّ نفسك في تجارب الزمن، أو سباق في حلباتنا الرسمية أو في مئات الإضافات… الخيار لك!''',
                'categories': ['Casual', 'Cult Classic', 'Open Source', 'Race']
            },
            {
                'title': "That's not my neighbor",
                'title_ar': 'هذا ليس جارِي',
                'description': '''The Doppelganger Detection Department (D.D.D.) needs you!
There is a vacancy for the doorman position in your building and since you need the money and can't find a job you have no choice.
It's 1955 and for unknown reasons doppelgangers are more common than normal, so the D.D.D. has taken action on the matter.
Your job will be to allow or deny the entry of the subjects who request entry to the building, it seems easy, but be careful, you can't overlook any detail because you could be food for doppelgangers.''',
                'description_ar': '''قسم الكشف عن التوائم (D.D.D.) يحتاجك!
هناك شاغر لوظيفة حارس البناية في مبناك، وبما أنك بحاجة إلى المال ولا تستطيع العثور على وظيفة، ليس أمامك خيار آخر.
إنها سنة 1955، ولسبب غير معلوم، أصبحت التوائم أكثر شيوعًا من المعتاد، لذا فقد اتخذ قسم الكشف عن التوائم (D.D.D.) الإجراءات اللازمة حيال ذلك.
وظيفتك هي السماح أو رفض دخول الأشخاص الذين يطلبون دخول المبنى، يبدو الأمر سهلًا، ولكن احترس! لا يمكنك التغاضي عن أي تفاصيل، لأنك قد تصبح طعامًا للتوائم.''',
                'categories': ['2D', 'Horror', 'Monsters', 'Singleplayer']
            },
        ]

        games = []
        existing_tables = connection.introspection.table_names()
        m2m_table_name = 'games_game_categories'
        has_m2m_table = m2m_table_name in existing_tables

        for game_data in game_titles:
            developer = random.choice(devs)
            status = random.choice(['approved', 'approved', 'approved', 'pending', 'rejected'])
            
            game, created = Game.objects.get_or_create(
                title=game_data['title'],
                defaults={
                    'title_ar': game_data['title_ar'],
                    'description': game_data['description'],
                    'description_ar': game_data['description_ar'],
                    'developer': developer,
                    'status': status,
                    'file_path': 'games/dummy_game.zip'
                }
            )

            if has_m2m_table:
                selected_categories = [categories[cat_name] for cat_name in game_data['categories'] if cat_name in categories]
                if created:
                    game.categories.set(selected_categories)
                else:
                    for cat in selected_categories:
                        game.categories.add(cat)
            else:
                self.stdout.write(self.style.WARNING(
                    f"Skipping category assignment for game '{game_data['title']}' because table '{m2m_table_name}' does not exist."
                ))

            games.append(game)

            if created:
                # Try to attach real images from the repository if available.
                # Map known game titles to the folders under
                # management/commands/games/ where images live.
                games_images_root = os.path.join(
                    os.path.dirname(__file__), 'games'
                )
                title_to_folder = {
                    'BLACK SOULS': 'BLACK SOULS',
                    'Bloodmoney': 'bloodmoney',
                    'Jenny Game': 'jenny-game',
                    'MISIDE': 'miside',
                    'Petsitting': 'petsitting',
                    'Sacrifices Must Be Made': 'Sacrifices Must Be Made',
                    'Karts. Nitro. Action': 'supertuxkart',
                    "That's not my neighbor": 'thats-not-my-neighbor',
                }

                folder = title_to_folder.get(game.title)
                images = []
                if folder:
                    folder_path = os.path.join(games_images_root, folder)
                    if os.path.isdir(folder_path):
                        for fname in sorted(os.listdir(folder_path)):
                            if fname.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
                                images.append(os.path.join(folder_path, fname))

                if images:
                    # prefer a file named 'base' as the base image, otherwise first
                    base_idx = 0
                    for idx, p in enumerate(images):
                        if os.path.splitext(os.path.basename(p))[0].lower().startswith('base'):
                            base_idx = idx
                            break

                    for idx, img_path in enumerate(images):
                        try:
                            with open(img_path, 'rb') as f:
                                django_file = File(f)
                                screenshot = Screenshot(game=game, is_base=(idx == base_idx))
                                # save will write the file into MEDIA_ROOT/screenshots/
                                screenshot.image_path.save(
                                    os.path.basename(img_path), django_file, save=True
                                )
                        except Exception:
                            # fallback to a dummy screenshot path if any file fails
                            Screenshot.objects.create(
                                game=game,
                                image_path='screenshots/dummy_shot.jpg',
                                is_base=(idx == base_idx),
                            )
                else:
                    # no images available — create dummy screenshots
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
                num_games = random.randint(0, 5)
                selected_games = random.sample(
                    approved_games, min(num_games, len(approved_games))
                )
                for game in selected_games:
                    LibraryEntry.objects.get_or_create(user=user, game=game)
                    if random.choice([True, False]):
                        DownloadHistory.objects.create(
                            game=game,
                            user=user,
                            device_info='Windows PC',
                            ip_address=f'192.168.1.{random.randint(1, 255)}'
                        )

        # 5. Create Reviews for approved games
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
                num_reviews = random.randint(0, min(5, len(users)))
                if num_reviews == 0:
                    continue
                reviewers = random.sample(users, num_reviews)
                for reviewer in reviewers:
                    rating = random.randint(1, 5)
                    comment = random.choice(sample_comments)
                    Review.objects.get_or_create(
                        game=game,
                        user=reviewer,
                        defaults={'rating': rating, 'comment': comment}
                    )
        else:
            self.stdout.write(
                self.style.WARNING(
                    f"Skipping review creation because table '{review_table}' does not exist."
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                'Successfully populated database with example data!'
            )
        )
