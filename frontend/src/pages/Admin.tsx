import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gamesAPI } from '../services/api';
import type { Game } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import RetroButton from '../components/RetroButton';
import RetroInput from '../components/RetroInput';
import RetroTextarea from '../components/RetroTextarea';

const Admin: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectReason, setRejectReason] = useState<Record<number, string>>({});
  const [showRejectForm, setShowRejectForm] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchGames();
  }, [isAuthenticated, user, filter]);

  const fetchGames = async () => {
    try {
      const data = await gamesAPI.getGames();
      if (filter === 'all') {
        setGames(data);
      } else {
        setGames(data.filter(g => g.status === filter));
      }
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (gameId: number) => {
    try {
      await gamesAPI.updateGame(gameId, { status: 'approved' });
      fetchGames();
    } catch (error) {
      alert('FAILED TO APPROVE GAME');
    }
  };

  const handleReject = async (gameId: number) => {
    const reason = rejectReason[gameId] || '';
    if (!reason.trim()) {
      alert(t('admin.provideReason'));
      return;
    }
    try {
      await gamesAPI.updateGame(gameId, { status: 'rejected', rejection_reason: reason });
      setRejectReason({ ...rejectReason, [gameId]: '' });
      setShowRejectForm(null);
      fetchGames();
    } catch (error) {
      alert('FAILED TO REJECT GAME');
    }
  };

  const filteredGames = games.filter(game => {
    const title = (language === 'ar' ? game.title_ar : game.title).toLowerCase();
    const description = (language === 'ar' ? game.description_ar : game.description).toLowerCase();
    const search = searchQuery.toLowerCase();
    return title.includes(search) || description.includes(search);
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="font-pixel text-accent-red-bright animate-pulse">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-pixel-2xl text-accent-primary-bright mb-8 crt-glow">{t('admin.panel')}</h1>

      <div className="mb-6">
        <RetroInput
          placeholder={t('search.placeholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="section-divider"></div>

      <div className="flex flex-wrap gap-2 mb-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 font-pixel text-xs transition-all rounded ${filter === f
              ? 'bg-accent-primary/20 border border-accent-primary text-accent-primary-bright'
              : 'bg-bg-secondary border border-border-color text-text-primary hover:border-accent-primary'
              }`}
          >
            {f === 'all' ? t('common.all') : t(`common.status.${f}`)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredGames.map((game) => {
          const title = language === 'ar' ? game.title_ar : game.title;
          const description = language === 'ar' ? game.description_ar : game.description;

          return (
            <div
              key={game.id}
              className="bg-bg-secondary pixel-border p-6"
            >
              <div className="flex flex-col lg:flex-row justify-between items-start gap-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <div className="flex-1 text-left rtl:text-right w-full">
                  <h3 className="font-pixel-lg text-text-primary mb-2">{title}</h3>
                  <p className="text-text-secondary text-sm mb-4 line-clamp-2">{description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {game.categories.map((cat) => (
                      <span
                        key={cat.id}
                        className="px-2 py-1 bg-accent-primary/20 border border-accent-primary/30 rounded font-pixel text-xs text-accent-primary-bright"
                      >
                        {language === 'ar' ? cat.name_ar : cat.name}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-text-muted font-mono uppercase">
                    {t('admin.developerId')}: {game.developer} | {t('admin.created')}: {new Date(game.created_at).toLocaleDateString()}
                  </div>
                  {game.rejection_reason && (
                    <div className="mt-2 p-2 bg-error/20 border border-error/50 rounded text-xs text-error">
                      {t('admin.rejectionReason')}: {game.rejection_reason}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 min-w-[200px] w-full lg:w-auto">
                  <span className={`px-3 py-1 font-pixel text-xs text-center rounded ${game.status === 'approved' ? 'bg-success/20 text-success border border-success' :
                    game.status === 'pending' ? 'bg-warning/20 text-warning border border-warning' :
                      'bg-error/20 text-error border border-error'
                    }`}>
                    {t(`common.status.${game.status}`)}
                  </span>
                  {game.status === 'pending' && (
                    <>
                      <RetroButton
                        onClick={() => handleApprove(game.id)}
                        variant="primary"
                      >
                        {t('admin.approve')}
                      </RetroButton>
                      {showRejectForm === game.id ? (
                        <div className="space-y-2">
                          <RetroTextarea
                            value={rejectReason[game.id] || ''}
                            onChange={(e) => setRejectReason({ ...rejectReason, [game.id]: e.target.value })}
                            placeholder={`${t('admin.rejectionReason')}...`}
                            rows={3}
                            dir={language === 'ar' ? 'rtl' : 'ltr'}
                          />
                          <div className="flex gap-2">
                            <RetroButton
                              onClick={() => handleReject(game.id)}
                              variant="danger"
                              className="flex-1"
                            >
                              {t('common.confirm')}
                            </RetroButton>
                            <RetroButton
                              onClick={() => {
                                setShowRejectForm(null);
                                setRejectReason({ ...rejectReason, [game.id]: '' });
                              }}
                              variant="secondary"
                              className="flex-1"
                            >
                              {t('common.cancel')}
                            </RetroButton>
                          </div>
                        </div>
                      ) : (
                        <RetroButton
                          onClick={() => setShowRejectForm(game.id)}
                          variant="danger"
                        >
                          {t('admin.reject')}
                        </RetroButton>
                      )}
                    </>
                  )}
                  <RetroButton
                    onClick={() => navigate(`/games/${game.id}`)}
                    variant="secondary"
                  >
                    {t('common.view')}
                  </RetroButton>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredGames.length === 0 && (
        <div className="text-center py-16">
          <div className="font-pixel text-text-secondary mb-4 uppercase">{t('admin.noGamesFound')}</div>
        </div>
      )}
    </div>
  );
};

export default Admin;
