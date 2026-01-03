import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { gamesAPI, categoriesAPI, screenshotsAPI, BACKEND_URL } from '../services/api';
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
    if (confirm('DELETE THIS SCREENSHOT?')) {
      try {
        await screenshotsAPI.deleteScreenshot(screenshotId);
        if (editingGame) {
          const updated = await screenshotsAPI.getScreenshots(editingGame.id);
          setExistingScreenshots(updated);
        }
      } catch (error) {
        alert('FAILED TO DELETE SCREENSHOT');
      }
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
        // Prepare PATCH data (FormData doesn't work well for partial updates of nested fields in some DRF configs, 
        // but here we are mainly updating the model fields. For M2M we use category_ids)
        // Note: DRF PrimaryKeyRelatedField (source='categories') handles category_ids in PATCH if configured.
        const updateData: any = {
          title: formData.title,
          title_ar: formData.title_ar,
          description: formData.description,
          description_ar: formData.description_ar,
          category_ids: formData.category_ids,
        };

        // If file is provided, we need FormData for PATCH
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

      // Upload cover image as base screenshot
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

      // Upload banner image
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

      // Upload screenshots
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
        <div className="font-pixel text-accent-red-bright animate-pulse">LOADING...</div>
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
          {showForm ? 'CANCEL' : t('dashboard.submitGame')}
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
            <div className="grid md:grid-cols-2 gap-6">
              <RetroInput
                label="TITLE (EN)"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <RetroInput
                label="TITLE (AR)"
                value={formData.title_ar}
                onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                required
              />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <RetroTextarea
                label="DESCRIPTION (EN)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={6}
              />
              <RetroTextarea
                label="DESCRIPTION (AR)"
                value={formData.description_ar}
                onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                required
                rows={6}
              />
            </div>
            <div>
              <label className="block mb-2 font-pixel text-xs text-text-secondary">
                GAME FILE (ZIP, RAR, 7Z, EXE)
              </label>
              <input
                type="file"
                accept=".zip,.rar,.7z,.exe"
                onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                required={!editingGame}
                className="w-full px-4 py-3 bg-bg-tertiary border-2 border-border-color text-text-primary font-mono text-sm focus:outline-none focus:border-accent-red"
              />
              {editingGame && <p className="text-xs text-text-muted mt-1 italic">LEAVE EMPTY TO KEEP CURRENT FILE</p>}
            </div>
            <div>
              <label className="block mb-2 font-pixel text-xs text-text-secondary">
                COVER IMAGE (WILL BE SET AS BASE SCREENSHOT)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.files?.[0] || null })}
                className="w-full px-4 py-3 bg-bg-tertiary border-2 border-border-color text-text-primary font-mono text-sm focus:outline-none focus:border-accent-red"
              />
            </div>
            <div>
              <label className="block mb-2 font-pixel text-xs text-text-secondary">
                BANNER IMAGE
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, bannerImage: e.target.files?.[0] || null })}
                className="w-full px-4 py-3 bg-bg-tertiary border-2 border-border-color text-text-primary font-mono text-sm focus:outline-none focus:border-accent-red"
              />
            </div>
            <div>
              <label className="block mb-2 font-pixel text-xs text-text-secondary">
                SCREENSHOTS (MULTIPLE)
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
              <div>
                <label className="block mb-4 font-pixel text-xs text-accent-primary-bright">
                  MANAGE EXISTING SCREENSHOTS
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {existingScreenshots.map((s) => (
                    <div key={s.id} className="relative group aspect-square">
                      <img
                        src={getImageUrl(s.image_path)}
                        alt="Screenshot"
                        className="w-full h-full object-cover pixel-border"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteScreenshot(s.id)}
                        className="absolute top-1 right-1 bg-error text-white p-1 rounded font-pixel text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        X
                      </button>
                      {s.is_base && (
                        <span className="absolute bottom-1 left-1 bg-accent-primary text-black px-1 font-pixel text-[8px]">
                          BASE
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="block mb-2 font-pixel text-xs text-text-secondary">
                {t('gameForm.categories')}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
              {editingGame ? 'UPDATE GAME' : 'SUBMIT GAME'}
            </RetroButton>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGames.map((game) => {
          const title = language === 'ar' ? game.title_ar : game.title;
          return (
            <div
              key={game.id}
              className="bg-bg-secondary pixel-border p-6 hover:border-accent-red transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-pixel-lg text-text-primary flex-1">{title}</h3>
                <span className={`px-2 py-1 font-pixel text-xs rounded ${game.status === 'approved' ? 'bg-success/20 text-success border border-success' :
                  game.status === 'pending' ? 'bg-warning/20 text-warning border border-warning' :
                    'bg-error/20 text-error border border-error'
                  }`}>
                  {game.status.toUpperCase()}
                </span>
              </div>
              <p className="text-text-secondary text-sm mb-4 line-clamp-2" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                {language === 'ar' ? game.description_ar : game.description}
              </p>
              <div className="flex gap-2" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <RetroButton
                  onClick={() => navigate(`/games/${game.id}`)}
                  variant="secondary"
                  className="flex-1"
                >
                  VIEW
                </RetroButton>
                <RetroButton
                  onClick={() => handleEdit(game)}
                  variant="primary"
                  className="flex-1"
                >
                  EDIT
                </RetroButton>
                {(user?.role === 'admin' || user?.id === game.developer) && (
                  <RetroButton
                    onClick={async () => {
                      if (confirm('DELETE THIS GAME?')) {
                        try {
                          await gamesAPI.deleteGame(game.id);
                          fetchGames();
                        } catch (error) {
                          alert('FAILED TO DELETE GAME');
                        }
                      }
                    }}
                    variant="danger"
                  >
                    DELETE
                  </RetroButton>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredGames.length === 0 && (
        <div className="text-center py-16">
          <div className="font-pixel text-text-secondary mb-4">NO GAMES SUBMITTED YET</div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
