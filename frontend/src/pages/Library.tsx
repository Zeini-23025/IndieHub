import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { libraryAPI, screenshotsAPI, BACKEND_URL } from '../services/api';
import type { LibraryEntry, Screenshot } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import RetroButton from '../components/RetroButton';

const Library: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [libraryEntries, setLibraryEntries] = useState<LibraryEntry[]>([]);
  const [gameScreenshots, setGameScreenshots] = useState<Record<number, Screenshot[]>>({});
  const [loading, setLoading] = useState(true);

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
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const fetchLibrary = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const entries = await libraryAPI.getLibrary();
      setLibraryEntries(entries);

      // Fetch screenshots for library games
      const screenshots = await screenshotsAPI.getScreenshots();
      const grouped = screenshots.reduce((acc: Record<number, Screenshot[]>, curr: Screenshot) => {
        if (!acc[curr.game]) acc[curr.game] = [];
        acc[curr.game].push(curr);
        return acc;
      }, {});
      setGameScreenshots(grouped);
    } catch (error) {
      console.error('Error fetching library:', error);
      setLibraryEntries([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchLibrary();
  }, [isAuthenticated, navigate, fetchLibrary]);

  // Refresh library when navigating to this page
  useEffect(() => {
    if (isAuthenticated && location.pathname === '/library') {
      fetchLibrary();
    }
  }, [location.pathname, isAuthenticated, fetchLibrary]);


  const handleRemove = async (entryId: number) => {
    try {
      await libraryAPI.removeFromLibrary(entryId);
      setConfirmingId(null);
      fetchLibrary();
    } catch (error) {
      console.error('Error removing from library:', error);
    }
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
      <h1 className="font-pixel-2xl text-accent-primary-bright mb-8 crt-glow">
        {t('nav.library')}
      </h1>
      <div className="section-divider"></div>

      {libraryEntries.length === 0 ? (
        <div className="text-center py-16 bg-bg-secondary pixel-border p-12">
          <div className="font-pixel-xl text-text-secondary mb-4">{t('library.empty')}</div>
          <p className="text-text-muted font-mono text-sm mb-6">{t('library.addGames')}</p>
          <Link to="/games">
            <RetroButton variant="primary">{t('nav.games').toUpperCase()}</RetroButton>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          {libraryEntries.map((entry) => {
            const game = entry.game;
            const title = language === 'ar' ? game.title_ar : game.title;
            const isConfirming = confirmingId === entry.id;

            return (
              <div
                key={entry.id}
                className="game-card pixel-border group relative"
              >
                <Link to={`/games/${game.id}`} className="block">
                  <div className="relative aspect-[3/4] bg-bg-tertiary overflow-hidden">
                    {gameScreenshots[game.id]?.find(s => s.is_base) || gameScreenshots[game.id]?.[0] ? (
                      <img
                        src={getImageUrl((gameScreenshots[game.id]?.find(s => s.is_base) || gameScreenshots[game.id]?.[0]).image_path)}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
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
                <div className="p-4 border-t-2 border-border-color">
                  {!isConfirming ? (
                    <RetroButton
                      onClick={() => setConfirmingId(entry.id)}
                      variant="danger"
                      className="w-full text-[10px]"
                    >
                      {t('game.removeFromLibrary')}
                    </RetroButton>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-pixel text-[8px] text-error text-center mb-1 animate-pulse">
                        {t('library.confirmRemove')}
                      </p>
                      <div className="flex gap-2">
                        <RetroButton
                          onClick={() => handleRemove(entry.id)}
                          variant="danger"
                          className="flex-1 text-[8px] py-1"
                        >
                          {t('common.confirm')}
                        </RetroButton>
                        <RetroButton
                          onClick={() => setConfirmingId(null)}
                          variant="secondary"
                          className="flex-1 text-[8px] py-1 text-text-primary border-text-secondary"
                        >
                          {t('common.cancel')}
                        </RetroButton>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Library;
