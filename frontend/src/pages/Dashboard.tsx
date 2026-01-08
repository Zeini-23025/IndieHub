import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { gamesAPI, categoriesAPI, screenshotsAPI, BACKEND_URL, analyticsAPI } from '../services/api';
import type { Game, Category, Screenshot } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import RetroButton from '../components/RetroButton';
import RetroInput from '../components/RetroInput';
import RetroTextarea from '../components/RetroTextarea';

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [existingScreenshots, setExistingScreenshots] = useState<Screenshot[]>([]);
  const [analyticsOpen, setAnalyticsOpen] = useState<Record<number, boolean>>({});
  const [analyticsData, setAnalyticsData] = useState<Record<number, any>>({});
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);
  const [confirmingScreenshotId, setConfirmingScreenshotId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    title_ar: '',
    description: '',
    description_ar: '',
    file: null as File | null,
    coverImage: null as File | null,
    bannerImage: null as File | null,
    screenshots: [] as File[],
    category_ids: [] as number[],
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

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'developer' && user?.role !== 'admin')) {
      navigate('/');
      return;
    }
    fetchGames();
    fetchCategories();
  }, [isAuthenticated, user]);

  const fetchGames = async () => {
    try {
      const data = await gamesAPI.getGames();
      if (user?.role === 'developer') {
        setGames(data.filter(g => g.developer === user.id));
      } else {
        setGames(data);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoriesAPI.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleEdit = async (game: Game) => {
    setEditingGame(game);
    setFormData({
      title: game.title,
      title_ar: game.title_ar,
      description: game.description,
      description_ar: game.description_ar,
      file: null,
      coverImage: null,
      bannerImage: null,
      screenshots: [],
      category_ids: game.categories.map(c => c.id),
    });

    try {
      const screenshots = await screenshotsAPI.getScreenshots(game.id);
      setExistingScreenshots(screenshots);
    } catch (error) {
      console.error('Error fetching screenshots:', error);
    }

    setShowForm(true);
  };

  const handleDeleteScreenshot = async (screenshotId: number) => {
    try {
      await screenshotsAPI.deleteScreenshot(screenshotId);
      setConfirmingScreenshotId(null);
      if (editingGame) {
        const updated = await screenshotsAPI.getScreenshots(editingGame.id);
        setExistingScreenshots(updated);
      }
    } catch (error) {
      alert(t('common.error'));
    }
  };

  const fetchAnalyticsForGame = async (gameId: number) => {
    try {
      const [downloads, avgRatings, distribution] = await Promise.all([
        analyticsAPI.getDownloads({ game: gameId, interval: 'daily' }),
        analyticsAPI.getAvgRatings({ game: gameId, interval: 'daily' }),
        analyticsAPI.getRatingDistribution({ game: gameId }),
      ]);
      setAnalyticsData(prev => ({ ...prev, [gameId]: { downloads, avgRatings, distribution } }));
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const handleDeleteGame = async (gameId: number) => {
    try {
      await gamesAPI.deleteGame(gameId);
      setConfirmingDeleteId(null);
      fetchGames();
    } catch (error) {
      alert(t('common.error'));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('title_ar', formData.title_ar);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('description_ar', formData.description_ar);
    if (formData.file) {
      formDataToSend.append('file_path', formData.file);
    }
    formData.category_ids.forEach(id => {
      formDataToSend.append('category_ids', id.toString());
    });

    try {
      let savedGame: Game;
      if (editingGame) {
        const updateData: any = {
          title: formData.title,
          title_ar: formData.title_ar,
          description: formData.description,
          description_ar: formData.description_ar,
          category_ids: formData.category_ids,
        };

        if (formData.file) {
          const patchFormData = new FormData();
          Object.keys(updateData).forEach(key => {
            if (key === 'category_ids') {
              formData.category_ids.forEach(id => patchFormData.append('category_ids', id.toString()));
            } else {
              patchFormData.append(key, updateData[key]);
            }
          });
          patchFormData.append('file_path', formData.file);
          savedGame = await gamesAPI.updateGame(editingGame.id, patchFormData);
        } else {
          savedGame = await gamesAPI.updateGame(editingGame.id, updateData);
        }
      } else {
        savedGame = await gamesAPI.createGame(formDataToSend);
      }

      const targetGameId = savedGame.id;

      if (formData.coverImage && targetGameId) {
        const coverFormData = new FormData();
        coverFormData.append('game', targetGameId.toString());
        coverFormData.append('image_path', formData.coverImage);
        coverFormData.append('is_base', 'true');
        try {
          await screenshotsAPI.uploadScreenshot(coverFormData);
        } catch (error) {
          console.error('Failed to upload cover image:', error);
        }
      }

      if (formData.bannerImage && targetGameId) {
        const bannerFormData = new FormData();
        bannerFormData.append('game', targetGameId.toString());
        bannerFormData.append('image_path', formData.bannerImage);
        bannerFormData.append('is_base', 'false');
        try {
          await screenshotsAPI.uploadScreenshot(bannerFormData);
        } catch (error) {
          console.error('Failed to upload banner image:', error);
        }
      }

      for (const screenshot of formData.screenshots) {
        if (targetGameId) {
          const screenshotFormData = new FormData();
          screenshotFormData.append('game', targetGameId.toString());
          screenshotFormData.append('image_path', screenshot);
          screenshotFormData.append('is_base', 'false');
          try {
            await screenshotsAPI.uploadScreenshot(screenshotFormData);
          } catch (error) {
            console.error('Failed to upload screenshot:', error);
          }
        }
      }

      setShowForm(false);
      setEditingGame(null);
      setFormData({
        title: '',
        title_ar: '',
        description: '',
        description_ar: '',
        file: null,
        coverImage: null,
        bannerImage: null,
        screenshots: [],
        category_ids: [],
      });
      fetchGames();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to save game');
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-pixel-2xl text-accent-primary-bright crt-glow">
          {t('dashboard.myGames')}
        </h1>
        <RetroButton
          onClick={() => {
            if (showForm) {
              setEditingGame(null);
              setFormData({
                title: '',
                title_ar: '',
                description: '',
                description_ar: '',
                file: null,
                coverImage: null,
                bannerImage: null,
                screenshots: [],
                category_ids: [],
              });
            }
            setShowForm(!showForm);
          }}
          variant={showForm ? 'secondary' : 'primary'}
        >
          {showForm ? t('common.cancel') : t('dashboard.submitGame')}
        </RetroButton>
      </div>

      <div className="section-divider"></div>

      <div className="mb-8">
        <RetroInput
          placeholder={t('search.placeholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {showForm && (
        <div className="bg-bg-secondary pixel-border p-8 mb-8">
          <h2 className="font-pixel-xl text-accent-primary-bright mb-6">
            {editingGame ? `EDIT: ${editingGame.title}` : t('dashboard.submitGame')}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <RetroInput
                label={`${t('gameForm.title')} (EN)`}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <RetroInput
                label={`${t('gameForm.title')} (AR)`}
                value={formData.title_ar}
                onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                required
                dir="rtl"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <RetroTextarea
                label={`${t('gameForm.description')} (EN)`}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={6}
              />
              <RetroTextarea
                label={`${t('gameForm.description')} (AR)`}
                value={formData.description_ar}
                onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                required
                rows={6}
                dir="rtl"
              />
            </div>
            <div className="text-left">
              <label className="block mb-2 font-pixel text-xs text-text-secondary">
                {t('dashboard.gameFile')} (ZIP, RAR, 7Z, EXE)
              </label>
              <input
                type="file"
                accept=".zip,.rar,.7z,.exe"
                onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                required={!editingGame}
                className="w-full px-4 py-3 bg-bg-tertiary border-2 border-border-color text-text-primary font-mono text-sm focus:outline-none focus:border-accent-red"
              />
              {editingGame && <p className="text-xs text-text-muted mt-1 italic">{t('dashboard.leaveEmpty')}</p>}
            </div>
            <div className="text-left">
              <label className="block mb-2 font-pixel text-xs text-text-secondary">
                {t('dashboard.coverImage')} ({t('dashboard.screenshots')})
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.files?.[0] || null })}
                className="w-full px-4 py-3 bg-bg-tertiary border-2 border-border-color text-text-primary font-mono text-sm focus:outline-none focus:border-accent-red"
              />
            </div>
            <div className="text-left">
              <label className="block mb-2 font-pixel text-xs text-text-secondary">
                {t('dashboard.bannerImage')}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, bannerImage: e.target.files?.[0] || null })}
                className="w-full px-4 py-3 bg-bg-tertiary border-2 border-border-color text-text-primary font-mono text-sm focus:outline-none focus:border-accent-red"
              />
            </div>
            <div className="text-left">
              <label className="block mb-2 font-pixel text-xs text-text-secondary">
                {t('dashboard.screenshots')} (MULTIPLE)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setFormData({
                  ...formData,
                  screenshots: Array.from(e.target.files || [])
                })}
                className="w-full px-4 py-3 bg-bg-tertiary border-2 border-border-color text-text-primary font-mono text-sm focus:outline-none focus:border-accent-red"
              />
            </div>

            {editingGame && existingScreenshots.length > 0 && (
              <div className="text-left">
                <label className="block mb-4 font-pixel text-xs text-accent-primary-bright">
                  {t('dashboard.manageScreenshots')}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {existingScreenshots.map((s) => (
                    <div key={s.id} className="relative group aspect-square">
                      <img
                        src={getImageUrl(s.image_path)}
                        alt="Screenshot"
                        className="w-full h-full object-cover pixel-border"
                      />
                      {confirmingScreenshotId !== s.id ? (
                        <button
                          type="button"
                          onClick={() => setConfirmingScreenshotId(s.id)}
                          className="absolute top-1 right-1 bg-error text-white p-1 rounded font-pixel text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          X
                        </button>
                      ) : (
                        <div className="absolute inset-0 bg-bg-primary/90 flex flex-col items-center justify-center p-2 z-10">
                          <p className="font-pixel text-[8px] text-error text-center mb-2 uppercase">{t('common.confirm')}?</p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleDeleteScreenshot(s.id)}
                              className="bg-error text-white px-2 py-1 font-pixel text-[8px] hover:bg-error-bright"
                            >
                              Y
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmingScreenshotId(null)}
                              className="bg-bg-secondary text-text-primary px-2 py-1 font-pixel text-[8px] border border-border-color"
                            >
                              N
                            </button>
                          </div>
                        </div>
                      )}
                      {s.is_base && (
                        <span className="absolute bottom-1 right-1 bg-accent-primary text-black px-1 font-pixel text-[8px]">
                          BASE
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="block mb-2 font-pixel text-xs text-text-secondary text-left">
                {t('gameForm.categories')}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.category_ids.includes(cat.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, category_ids: [...formData.category_ids, cat.id] });
                        } else {
                          setFormData({ ...formData, category_ids: formData.category_ids.filter(id => id !== cat.id) });
                        }
                      }}
                      className="w-4 h-4 accent-accent-red"
                    />
                    <span className="font-mono text-xs text-text-primary">
                      {language === 'ar' ? cat.name_ar : cat.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <RetroButton type="submit" variant="primary">
              {editingGame ? t('common.update') : t('common.submit')}
            </RetroButton>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGames.map((game) => {
          const title = language === 'ar' ? game.title_ar : game.title;
          const isConfirming = confirmingDeleteId === game.id;

          return (
            <div
              key={game.id}
              className="bg-bg-secondary pixel-border p-6 hover:border-accent-red transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4 text-left">
                  <h3 className="font-pixel-lg text-text-primary flex-1">{title}</h3>
                  <span className={`px-2 py-1 font-pixel text-xs rounded ${game.status === 'approved' ? 'bg-success/20 text-success border border-success' :
                    game.status === 'pending' ? 'bg-warning/20 text-warning border border-warning' :
                      'bg-error/20 text-error border border-error'
                    }`}>
                    {t(`common.status.${game.status}`)}
                  </span>
                </div>
                <p className="text-text-secondary text-sm mb-4 line-clamp-2 text-left" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  {language === 'ar' ? game.description_ar : game.description}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-2" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  <RetroButton
                    onClick={() => navigate(`/games/${game.id}`)}
                    variant="secondary"
                    className="flex-1 min-w-[80px] text-[10px]"
                  >
                    {t('common.view')}
                  </RetroButton>
                  <RetroButton
                    onClick={() => handleEdit(game)}
                    variant="primary"
                    className="flex-1 min-w-[80px] text-[10px]"
                  >
                    {t('common.edit')}
                  </RetroButton>
                  <RetroButton
                    onClick={async () => {
                      const currentlyOpen = analyticsOpen[game.id];
                      if (!currentlyOpen) {
                        await fetchAnalyticsForGame(game.id);
                      }
                      setAnalyticsOpen(prev => ({ ...prev, [game.id]: !currentlyOpen }));
                    }}
                    variant="secondary"
                    className="flex-1 min-w-[80px] text-[10px]"
                  >
                    {t('dashboard.analytics')}
                  </RetroButton>
                </div>

                {(user?.role === 'admin' || user?.id === game.developer) && (
                  <div className="mt-2 pt-2 border-t border-border-color">
                    {!isConfirming ? (
                      <RetroButton
                        onClick={() => setConfirmingDeleteId(game.id)}
                        variant="danger"
                        className="w-full text-[10px]"
                      >
                        {t('common.delete')}
                      </RetroButton>
                    ) : (
                      <div className="bg-bg-tertiary p-3 rounded border border-error/30 animate-pulse">
                        <p className="font-pixel text-[10px] text-error text-center mb-3">
                          {t('dashboard.deleteConfirm')}
                        </p>
                        <div className="flex gap-2">
                          <RetroButton
                            onClick={() => handleDeleteGame(game.id)}
                            variant="danger"
                            className="flex-1 text-[8px] py-1"
                          >
                            {t('common.confirm')}
                          </RetroButton>
                          <RetroButton
                            onClick={() => setConfirmingDeleteId(null)}
                            variant="secondary"
                            className="flex-1 text-[8px] py-1"
                          >
                            {t('common.cancel')}
                          </RetroButton>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {analyticsOpen[game.id] && (
                <div className="mt-4 bg-bg-tertiary p-4 rounded border border-border-color">
                  <div className="mb-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <h4 className="font-pixel text-xs text-accent-primary-bright mb-2">{t('dashboard.downloadsDaily')}</h4>
                    {analyticsData[game.id]?.downloads?.length ? (
                      <div className="space-y-1">
                        {analyticsData[game.id].downloads.map((d: any) => {
                          const max = Math.max(...analyticsData[game.id].downloads.map((x: any) => x.count), 1);
                          const width = Math.round((d.count / max) * 100);
                          return (
                            <div key={d.period} className="flex items-center gap-2">
                              <div className="text-[10px] text-text-muted w-24 text-left">{d.period}</div>
                              <div className="bg-accent-primary/40 h-3 rounded" style={{ width: `${width}%` }} />
                              <div className="text-xs text-text-primary ml-2">{d.count}</div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-text-muted">{t('dashboard.noData')}</div>
                    )}
                  </div>

                  <div className="mb-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <h4 className="font-pixel text-xs text-accent-primary-bright mb-2">{t('dashboard.ratingDaily')}</h4>
                    {analyticsData[game.id]?.avgRatings?.length ? (
                      <div className="space-y-1">
                        {analyticsData[game.id].avgRatings.map((r: any) => (
                          <div key={r.period} className="flex items-center gap-2">
                            <div className="text-[10px] text-text-muted w-24 text-left">{r.period}</div>
                            <div className="flex-1 bg-bg-secondary h-3 rounded relative">
                              <div className="bg-accent-primary h-3 rounded" style={{ width: `${(r.average / 5) * 100}%` }} />
                            </div>
                            <div className="text-xs text-text-primary ml-2">{r.average.toFixed(2)}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-text-muted">{t('dashboard.noData')}</div>
                    )}
                  </div>

                  <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <h4 className="font-pixel text-xs text-accent-primary-bright mb-2">{t('dashboard.ratingDistribution')}</h4>
                    {analyticsData[game.id]?.distribution ? (
                      <div className="space-y-1">
                        {Object.entries(analyticsData[game.id].distribution.distribution || {}).map(([star, count]: any) => {
                          const distributionValues = Object.values(analyticsData[game.id].distribution.distribution || {}) as number[];
                          const max = Math.max(...distributionValues, 1);
                          const width = Math.round((count / max) * 100);
                          return (
                            <div key={star} className="flex items-center gap-2">
                              <div className="text-[10px] text-text-muted w-12">{star}★</div>
                              <div className="bg-bg-secondary h-3 rounded flex-1">
                                <div className="bg-accent-primary h-3 rounded" style={{ width: `${width}%` }} />
                              </div>
                              <div className="text-xs text-text-primary ml-2">{count}</div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-text-muted">{t('dashboard.noData')}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredGames.length === 0 && (
        <div className="text-center py-16">
          <div className="font-pixel text-text-secondary mb-4 uppercase">{t('dashboard.noGames')}</div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
