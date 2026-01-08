import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { gamesAPI, categoriesAPI, screenshotsAPI, BACKEND_URL } from '../services/api';
import type { Game, Category, Screenshot } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const Games: React.FC = () => {
  const { language, t } = useLanguage();
  const [searchParams] = useSearchParams();
  const sortParam = searchParams.get('sort');

  const [games, setGames] = useState<Game[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [gameScreenshots, setGameScreenshots] = useState<Record<number, Screenshot[]>>({});
  const [hoveredGame, setHoveredGame] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [gamesData, categoriesData] = await Promise.all([
          gamesAPI.getGames(sortParam ? { sort: sortParam } : undefined),
          categoriesAPI.getCategories(),
        ]);
        setGames(gamesData);
        setCategories(categoriesData);

        // Fetch screenshots for all games
        const screenshotPromises = gamesData.map(async (game) => {
          try {
            const screenshots = await screenshotsAPI.getScreenshots(game.id);
            return { gameId: game.id, screenshots };
          } catch {
            return { gameId: game.id, screenshots: [] };
          }
        });
        const screenshotResults = await Promise.all(screenshotPromises);
        const screenshotMap: Record<number, Screenshot[]> = {};
        screenshotResults.forEach(({ gameId, screenshots }) => {
          screenshotMap[gameId] = screenshots;
        });
        setGameScreenshots(screenshotMap);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [sortParam]);

  const filteredGames = games.filter((game) => {
    const matchesCategory = selectedCategory === null || game.categories.some(cat => cat.id === selectedCategory);
    const title = language === 'ar' ? game.title_ar : game.title;
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && game.status === 'approved';
  });

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

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-pixel-2xl text-accent-primary-bright mb-4 crt-glow">
          {sortParam === 'popular' ? t('home.popular') :
            sortParam === 'top-rated' ? t('home.topRated') :
              sortParam === 'trending' ? t('home.trending') :
                sortParam === 'gems' ? t('home.gems') :
                  t('nav.games').toUpperCase()}
        </h1>
        <div className="section-divider"></div>
      </div>

      {/* Search and Filter */}
      <div className="mb-8 space-y-4">
        <div className="flex gap-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <input
            type="text"
            placeholder={t('search.placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-3 bg-bg-secondary border border-border-color text-text-primary text-sm rounded focus:outline-none focus:border-accent-primary focus:shadow-glow"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          />
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
            className="px-4 py-3 bg-bg-secondary border border-border-color text-text-primary text-sm rounded focus:outline-none focus:border-accent-primary focus:shadow-glow"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            <option value="">{t('filter.categories')}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {language === 'ar' ? cat.name_ar : cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Game Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {filteredGames.map((game) => {
          const title = language === 'ar' ? game.title_ar : game.title;
          const description = language === 'ar' ? game.description_ar : game.description;
          const screenshots = gameScreenshots[game.id] || [];
          const baseScreenshot = screenshots.find(s => s.is_base) || screenshots[0];
          const previewScreenshots = screenshots.filter(s => !s.is_base).slice(0, 2);
          const isHovered = hoveredGame === game.id;

          return (
            <div
              key={game.id}
              className="game-card pixel-border group relative"
              onMouseEnter={() => setHoveredGame(game.id)}
              onMouseLeave={() => setHoveredGame(null)}
            >
              {/* Game Cover */}
              <Link to={`/games/${game.id}`} className="block">
                <div className="relative aspect-[3/4] bg-bg-tertiary overflow-hidden">
                  {baseScreenshot ? (
                    <img
                      src={getImageUrl(baseScreenshot.image_path)}
                      alt={title}
                      className="w-full h-full object-cover pixel-blur transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl text-text-muted">🎮</span>
                    </div>
                  )}
                  {/* Status Badge */}
                  {game.status === 'approved' && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-success/20 border border-success rounded">
                      <span className="font-pixel text-xs text-success">{t('common.status.approved').toUpperCase()}</span>
                    </div>
                  )}
                </div>

                {/* Game Title */}
                <div className="p-4 bg-bg-secondary border-t-2 border-border-color">
                  <h3 className="font-pixel text-xs text-text-primary line-clamp-2 mb-2">
                    {title}
                  </h3>
                </div>
              </Link>

              {/* Hover Overlay with Description and Previews */}
              {isHovered && (
                <div className="absolute inset-0 bg-bg-primary/98 border border-accent-primary rounded z-10 p-4 flex flex-col backdrop-blur-sm">
                  <h3 className="font-pixel text-xs text-accent-primary-bright mb-3">
                    {title}
                  </h3>
                  <p className="text-[15px] text-text-primary mb-4 line-clamp-5 flex-1 leading-relaxed font-medium" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    {description}
                  </p>

                  {/* Preview Images */}
                  {previewScreenshots.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {previewScreenshots.map((screenshot) => (
                        <img
                          key={screenshot.id}
                          src={getImageUrl(screenshot.image_path)}
                          alt="Preview"
                          className="w-full h-20 object-cover rounded border border-border-color"
                        />
                      ))}
                    </div>
                  )}

                  {/* Categories */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {game.categories.slice(0, 3).map((cat) => (
                      <span
                        key={cat.id}
                        className="px-2 py-1 bg-accent-primary/20 border border-accent-primary/30 rounded text-xs font-pixel text-accent-primary-bright"
                      >
                        {language === 'ar' ? cat.name_ar : cat.name}
                      </span>
                    ))}
                  </div>

                  <Link to={`/games/${game.id}`}>
                    <button className="w-full btn-retro mt-auto">
                      {t('game.viewDetails').toUpperCase()}
                    </button>
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredGames.length === 0 && (
        <div className="text-center py-16">
          <div className="font-pixel text-text-secondary mb-4">{t('admin.noGamesFound')}</div>
          <p className="text-text-muted text-sm">
            {searchQuery ? t('search.placeholder') : t('dashboard.noGames')}
          </p>
        </div>
      )}
    </div>
  );
};

export default Games;
