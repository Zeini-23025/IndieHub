import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { gamesAPI, screenshotsAPI, BACKEND_URL } from '../services/api';
import type { Game, Screenshot } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const Home: React.FC = () => {
  const { language, t } = useLanguage();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameScreenshots, setGameScreenshots] = useState<Record<number, Screenshot[]>>({});
  const [hoveredGame, setHoveredGame] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const gamesData = await gamesAPI.getGames();
        setGames(gamesData);

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

  const approvedGames = games.filter(g => g.status === 'approved');
  const featuredGame = approvedGames[0];
  const popularGames = approvedGames.slice(0, 5);
  const newReleases = [...approvedGames].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 5);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="font-pixel text-accent-primary-bright animate-pulse">LOADING...</div>
      </div>
    );
  }

  const GameCard = ({ game }: { game: Game }) => {
    const title = language === 'ar' ? game.title_ar : game.title;
    const description = language === 'ar' ? game.description_ar : game.description;
    const screenshots = gameScreenshots[game.id] || [];
    const baseScreenshot = screenshots.find(s => s.is_base) || screenshots[0];
    const previewScreenshots = screenshots.filter(s => !s.is_base).slice(0, 2);
    const isHovered = hoveredGame === game.id;

    return (
      <div
        className="game-card pixel-border group relative"
        onMouseEnter={() => setHoveredGame(game.id)}
        onMouseLeave={() => setHoveredGame(null)}
      >
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
          </div>
          <div className="p-4 bg-bg-secondary border-t-2 border-border-color">
            <h3 className="font-pixel text-xs text-text-primary line-clamp-2 mb-2">
              {title}
            </h3>
          </div>
        </Link>

        {isHovered && (
          <div className="absolute inset-0 bg-bg-primary/98 border border-accent-primary rounded z-10 p-4 flex flex-col backdrop-blur-sm">
            <h3 className="font-pixel text-xs text-accent-primary-bright mb-3">{title}</h3>
            <p className="text-sm text-text-secondary mb-4 line-clamp-4 flex-1 leading-relaxed" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              {description}
            </p>
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
            <div className="flex flex-wrap gap-1.5 mb-3">
              {game.categories.slice(0, 3).map((cat) => (
                <span key={cat.id} className="px-2 py-1 bg-accent-primary/20 border border-accent-primary/30 rounded text-xs font-pixel text-accent-primary-bright">
                  {language === 'ar' ? cat.name_ar : cat.name}
                </span>
              ))}
            </div>
            <Link to={`/games/${game.id}`}>
              <button className="w-full btn-retro mt-auto">VIEW DETAILS</button>
            </Link>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Featured Banner */}
      {featuredGame && (
        <section className="relative h-[400px] pixel-border overflow-hidden group">
          <div className="absolute inset-0">
            {gameScreenshots[featuredGame.id]?.find(s => !s.is_base)?.image_path ? (
              <img
                src={getImageUrl(gameScreenshots[featuredGame.id].find(s => !s.is_base)!.image_path)}
                alt="Banner"
                className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full bg-bg-tertiary" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-transparent" />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col md:flex-row items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-block px-3 py-1 bg-accent-primary text-black font-pixel text-[10px] mb-4">
                {t('home.featured')}
              </span>
              <h1 className="font-pixel-3xl text-white mb-4 drop-shadow-lg">
                {language === 'ar' ? featuredGame.title_ar : featuredGame.title}
              </h1>
              <p className="text-text-secondary text-lg line-clamp-2 mb-6 drop-shadow" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                {language === 'ar' ? featuredGame.description_ar : featuredGame.description}
              </p>
              <Link to={`/games/${featuredGame.id}`}>
                <button className="px-8 py-4 bg-accent-primary text-black font-pixel text-sm hover:bg-accent-primary-bright transition-all transform hover:-translate-y-1 active:translate-y-0">
                  PLAY NOW
                </button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Popular Games Section */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <h2 className="font-pixel-xl text-accent-primary-bright crt-glow">
            {t('home.popular')}
          </h2>
          <Link to="/games" className="text-accent-primary hover:text-accent-primary-bright font-pixel text-xs transition-colors">
            {language === 'ar' ? 'عرض الكل' : 'VIEW ALL'} →
          </Link>
        </div>
        <div className="section-divider mb-8"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          {popularGames.map(game => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>

      {/* New Releases Section */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <h2 className="font-pixel-xl text-accent-primary-bright crt-glow">
            {t('home.newReleases')}
          </h2>
          <Link to="/games" className="text-accent-primary hover:text-accent-primary-bright font-pixel text-xs transition-colors">
            {language === 'ar' ? 'عرض الكل' : 'VIEW ALL'} →
          </Link>
        </div>
        <div className="section-divider mb-8"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          {newReleases.map(game => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
