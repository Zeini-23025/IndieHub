import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gamesAPI, screenshotsAPI, reviewsAPI, libraryAPI, downloadsAPI, BACKEND_URL } from '../services/api';
import type { Game, Screenshot, Review } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import RetroButton from '../components/RetroButton';
import RetroTextarea from '../components/RetroTextarea';

const GameDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { language, t } = useLanguage();
  const [game, setGame] = useState<Game | null>(null);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

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
    const fetchData = async () => {
      if (!id) return;
      try {
        const [gameData, reviewsData] = await Promise.all([
          gamesAPI.getGame(parseInt(id)),
          reviewsAPI.getReviews(parseInt(id)),
        ]);
        setGame(gameData);
        setReviews(reviewsData);

        try {
          const screenshotsData = await screenshotsAPI.getScreenshots(parseInt(id));
          setScreenshots(screenshotsData);
          if (screenshotsData.length > 0) {
            setSelectedImage(0);
          }
        } catch {
          setScreenshots([]);
        }

        if (isAuthenticated) {
          try {
            const library = await libraryAPI.getLibrary();
            setIsInLibrary(library.some(entry => entry.game.id === parseInt(id)));
          } catch { }
        }
      } catch (error) {
        console.error('Error fetching game data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isAuthenticated]);

  const handleAddToLibrary = async () => {
    if (!id || !isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await libraryAPI.addToLibrary(parseInt(id));
      setIsInLibrary(true);
      // Refresh library data to ensure it's up to date
      const library = await libraryAPI.getLibrary();
      setIsInLibrary(library.some(entry => entry.game.id === parseInt(id)));
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to add to library');
    }
  };

  const handleRemoveFromLibrary = async () => {
    if (!id) return;
    try {
      const library = await libraryAPI.getLibrary();
      const entry = library.find(e => e.game.id === parseInt(id));
      if (entry) {
        await libraryAPI.removeFromLibrary(entry.id);
        setIsInLibrary(false);
        // Verify removal
        const updatedLibrary = await libraryAPI.getLibrary();
        setIsInLibrary(updatedLibrary.some(e => e.game.id === parseInt(id)));
      }
    } catch (error) {
      console.error('Error removing from library:', error);
    }
  };

  const handleDownload = async () => {
    if (!id || !isAuthenticated) {
      navigate('/login');
      return;
    }
    setDownloading(true);
    try {
      const blob = await downloadsAPI.downloadGame(parseInt(id));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${game?.title || 'game'}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Failed to download game');
    } finally {
      setDownloading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!id || !isAuthenticated) return;
    try {
      await reviewsAPI.createReview(parseInt(id), reviewRating, reviewComment);
      const updatedReviews = await reviewsAPI.getReviews(parseInt(id));
      setReviews(updatedReviews);
      setReviewComment('');
      setShowReviewForm(false);
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to submit review');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="font-pixel text-accent-primary-bright animate-pulse">{t('common.loading')}</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="text-center py-16">
        <div className="font-pixel text-text-secondary mb-4">{t('game.notFound')}</div>
      </div>
    );
  }

  const title = language === 'ar' ? game.title_ar : game.title;
  const description = language === 'ar' ? game.description_ar : game.description;
  const baseScreenshot = screenshots.find(s => s.is_base) || screenshots[0];
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="space-y-8">
      {/* Game Banner */}
      <div className="relative h-96 bg-bg-tertiary overflow-hidden rounded-lg pixel-border-accent">
        {baseScreenshot ? (
          <img
            src={getImageUrl(baseScreenshot.image_path)}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-9xl text-text-muted">🎮</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <h1 className="font-pixel-2xl text-accent-primary-bright mb-2 crt-glow">
            {title}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">★</span>
              <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
              <span className="text-text-muted text-sm">({reviews.length})</span>
            </div>
            <span className={`px-3 py-1 font-pixel text-xs rounded ${game.status === 'approved' ? 'bg-success/20 text-success border border-success' :
              game.status === 'pending' ? 'bg-warning/20 text-warning border border-warning' :
                'bg-error/20 text-error border border-error'
              }`}>
              {game.status === 'approved' ? t('common.status.approved').toUpperCase() :
                game.status === 'pending' ? t('common.status.pending').toUpperCase() :
                  t('common.status.rejected').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {game.status === 'approved' && (
          <RetroButton
            onClick={handleDownload}
            disabled={downloading}
            variant="primary"
          >
            {downloading ? t('game.downloading').toUpperCase() : t('game.download').toUpperCase()}
          </RetroButton>
        )}
        {isAuthenticated && game.status === 'approved' && (
          <>
            {isInLibrary ? (
              <RetroButton
                onClick={handleRemoveFromLibrary}
                variant="secondary"
              >
                {t('game.removeFromLibrary')}
              </RetroButton>
            ) : (
              <RetroButton
                onClick={handleAddToLibrary}
                variant="secondary"
              >
                {t('game.addToLibrary')}
              </RetroButton>
            )}
          </>
        )}
      </div>

      <div className="section-divider"></div>

      {/* Game Description */}
      <section className="bg-bg-secondary pixel-border p-6 rounded-lg">
        <h2 className="font-pixel-lg text-accent-primary-bright mb-4">{t('game.description')}</h2>
        <p className="text-text-primary text-sm leading-relaxed whitespace-pre-wrap" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          {description}
        </p>
      </section>

      {/* Categories */}
      <section>
        <h2 className="font-pixel-lg text-accent-primary-bright mb-4">{t('game.categories')}</h2>
        <div className="flex flex-wrap gap-2">
          {game.categories.map((cat) => (
            <span
              key={cat.id}
              className="px-3 py-1.5 bg-accent-primary/20 border border-accent-primary/30 rounded font-pixel text-xs text-accent-primary-bright"
            >
              {language === 'ar' ? cat.name_ar : cat.name}
            </span>
          ))}
        </div>
      </section>

      <div className="section-divider"></div>

      {/* Screenshot Gallery */}
      {screenshots.length > 0 && (
        <section>
          <h2 className="font-pixel-lg text-accent-primary-bright mb-4">{t('game.screenshots')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {screenshots.map((screenshot, index) => (
              <button
                key={screenshot.id}
                onClick={() => setSelectedImage(index)}
                className={`aspect-video bg-bg-tertiary overflow-hidden rounded pixel-border transition-all ${selectedImage === index ? 'border-accent-primary shadow-glow' : ''
                  }`}
              >
                <img
                  src={getImageUrl(screenshot.image_path)}
                  alt={`Screenshot ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                />
              </button>
            ))}
          </div>
          {selectedImage !== null && (
            <div className="mt-6">
              <div className="pixel-border-accent p-4 bg-bg-secondary rounded-lg">
                <img
                  src={getImageUrl(screenshots[selectedImage].image_path)}
                  alt="Selected screenshot"
                  className="w-full max-h-96 object-contain rounded"
                />
              </div>
            </div>
          )}
        </section>
      )}

      <div className="section-divider"></div>

      {/* Reviews Section */}
      <section className="bg-bg-secondary pixel-border p-6 rounded-lg">
        <div className="flex justify-between items-center mb-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <h2 className="font-pixel-lg text-accent-primary-bright">{t('game.reviews')}</h2>
          {isAuthenticated && !showReviewForm && (
            <RetroButton
              onClick={() => setShowReviewForm(true)}
              variant="primary"
            >
              {t('game.writeReview')}
            </RetroButton>
          )}
        </div>

        {showReviewForm && (
          <div className="mb-6 p-4 bg-bg-tertiary pixel-border rounded-lg" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="mb-4">
              <label className="block mb-2 font-pixel text-xs" style={{ color: 'var(--text-secondary)' }}>{t('game.rating')}</label>
              <select
                value={reviewRating}
                onChange={(e) => setReviewRating(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-bg-secondary border border-border-color text-text-primary text-sm rounded focus:outline-none focus:border-accent-primary"
                style={{ fontFamily: 'inherit' }}
              >
                {[1, 2, 3, 4, 5].map(r => (
                  <option key={r} value={r}>{r} ★</option>
                ))}
              </select>
            </div>
            <RetroTextarea
              label={t('game.comment')}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2 mt-4">
              <RetroButton onClick={handleSubmitReview} variant="primary">
                {t('common.submit').toUpperCase()}
              </RetroButton>
              <RetroButton
                onClick={() => {
                  setShowReviewForm(false);
                  setReviewComment('');
                }}
                variant="secondary"
              >
                {t('common.cancel').toUpperCase()}
              </RetroButton>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="p-4 bg-bg-tertiary pixel-border rounded-lg">
              <div className="flex justify-between items-start mb-2" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <div className="flex items-center gap-3" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  {review.user_profile_image ? (
                    <img
                      src={review.user_profile_image}
                      alt={review.user_username}
                      className="w-10 h-10 rounded-full object-cover border border-accent-primary/30"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-accent-primary/20 border border-accent-primary/30 rounded-full flex items-center justify-center">
                      <span className="font-pixel text-xs text-accent-primary-bright">
                        {review.user_username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="font-pixel text-xs text-text-primary">{review.user_username}</div>
                    <div className="text-yellow-400 text-sm">
                      {'★'.repeat(review.rating)}
                    </div>
                  </div>
                </div>
                <span className="text-text-muted text-xs">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              {review.comment && (
                <p className="text-text-secondary text-sm mt-2 leading-relaxed" dir={language === 'ar' ? 'rtl' : 'ltr'}>{review.comment}</p>
              )}
            </div>
          ))}
          {reviews.length === 0 && (
            <div className="text-center py-8">
              <p className="text-text-muted text-sm">{t('game.noReviews')}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default GameDetail;
