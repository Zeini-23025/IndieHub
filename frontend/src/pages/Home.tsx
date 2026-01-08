import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { gamesAPI, BACKEND_URL } from '../services/api';
import type { Game, HomeSections } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import GameSection from '../components/GameSection';

const Home: React.FC = () => {
  const { language, t } = useLanguage();
  const [sections, setSections] = useState<HomeSections | null>(null);
  const [featuredGame, setFeaturedGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sectionsData = await gamesAPI.getHomeSections();
        setSections(sectionsData);

        // Pick featured game from new releases or most popular
        const potentialFeatured = sectionsData.new_releases.length > 0
          ? sectionsData.new_releases[0]
          : sectionsData.most_popular[0];

        if (potentialFeatured) {
          setFeaturedGame(potentialFeatured);
        }
      } catch (error) {
        console.error('Error fetching home sections:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) {
      try {
        const url = new URL(path);
        return `${BACKEND_URL}${url.pathname}`;
      } catch (e) {
        return path;
      }
    }
    return `${BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="font-pixel text-accent-primary-bright animate-pulse">{t('common.loading')}</div>
      </div>
    );
  }

  const direction = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <div className="space-y-16 pb-20">
      {/* Hero / Featured Banner */}
      {featuredGame && (
        <section className="relative h-[500px] pixel-border overflow-hidden">
          <div className="absolute inset-0 z-0">
            {featuredGame.base_screenshot ? (
              <img
                src={getImageUrl(featuredGame.base_screenshot)}
                alt="Banner"
                className="w-full h-full object-cover filter brightness-50"
              />
            ) : (
              <div className="w-full h-full bg-bg-tertiary" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/50 to-transparent" />
          </div>

          <div className="relative z-10 h-full max-w-7xl mx-auto px-8 flex flex-col justify-center">
            <div className="max-w-2xl">
              <span className="inline-block px-3 py-1 bg-accent-primary text-black font-pixel text-[10px] mb-4">
                {t('home.featured')}
              </span>
              <h1 className="font-pixel-2xl text-white mb-6 drop-shadow-lg">
                {language === 'ar' ? featuredGame.title_ar : featuredGame.title}
              </h1>
              <p className="text-text-secondary text-lg mb-8 line-clamp-3" dir={direction}>
                {language === 'ar' ? featuredGame.description_ar : featuredGame.description}
              </p>
              <Link to={`/games/${featuredGame.id}`}>
                <button className="btn-retro px-8 py-3">
                  {t('game.playNow')}
                </button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {sections && (
        <div className="max-w-7xl mx-auto px-4 space-y-16">
          <GameSection
            title={t('home.popular')}
            description={t('home.mostPopularDesc')}
            games={sections.most_popular}
            viewAllLink="/games?sort=popular"
            dir={direction}
          />

          <GameSection
            title={t('home.newReleases')}
            description={t('home.newReleasesDesc')}
            games={sections.new_releases}
            viewAllLink="/games?sort=newest"
            dir={direction}
          />

          <GameSection
            title={t('home.topRated')}
            description={t('home.topRatedDesc')}
            games={sections.top_rated}
            viewAllLink="/games?sort=top-rated"
            dir={direction}
          />

          <GameSection
            title={t('home.trending')}
            description={t('home.trendingDesc')}
            games={sections.trending_now}
            viewAllLink="/games?sort=trending"
            dir={direction}
          />

          <GameSection
            title={t('home.gems')}
            description={t('home.hiddenGemsDesc')}
            games={sections.hidden_gems}
            viewAllLink="/games?sort=gems"
            dir={direction}
          />
        </div>
      )}

      {/* Retro Call to Action */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="pixel-border p-8 bg-bg-secondary flex flex-col md:flex-row items-center justify-between gap-6" dir={direction}>
          <div className="text-center md:text-left rtl:md:text-right">
            <h2 className="font-pixel-xl text-white mb-2">{t('home.devQuestion')}</h2>
            <p className="text-text-secondary font-pixel text-[10px]">
              {t('home.devAction')}
            </p>
          </div>
          <Link to="/register">
            <button className="btn-retro">
              {t('home.startToday')}
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
