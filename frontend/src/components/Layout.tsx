import type { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import RetroButton from './RetroButton';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const getProfileImageUrl = (imagePath?: string) => {
    if (!imagePath) return '/default-avatar.svg';
    if (imagePath.startsWith('http')) return imagePath;
    // Handle both /media/... and media/... paths
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `http://127.0.0.1:8000${cleanPath}`;
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex">
      {/* Sidebar Navigation */}
      <aside className={`w-64 bg-bg-secondary border-e border-border-color p-6 flex flex-col fixed h-screen z-50 ${language === 'ar' ? 'right-0' : 'left-0'}`}>
        <Link to="/" className="mb-6">
          <h1 className="font-pixel-xl text-accent-primary-bright text-center crt-glow">
            {t('app.name')}
          </h1>
        </Link>

        {/* User Info Section - Only show when authenticated */}
        {isAuthenticated && user && (
          <div className="mb-4 pb-4 border-b-2 border-border-color">
            <Link to="/profile" className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-accent-primary/30">
                <img
                  src={getProfileImageUrl(user.profile_image)}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center">
                <p className="font-pixel text-xs text-accent-primary-bright">@{user.username}</p>
                <p className="font-mono text-[10px] text-text-muted uppercase">{user.role}</p>
              </div>
            </Link>
          </div>
        )}

        <nav className="flex-1 space-y-1">
          <Link
            to="/"
            className={`block px-4 py-2.5 font-pixel text-xs transition-all rounded ${isActive('/')
              ? 'bg-accent-primary/20 border-s-2 border-accent-primary text-accent-primary-bright'
              : 'hover:bg-bg-tertiary hover:text-accent-primary-bright text-text-secondary'
              }`}
          >
            {t('nav.home')}
          </Link>

          <Link
            to="/games"
            className={`block px-4 py-2.5 font-pixel text-xs transition-all rounded ${isActive('/games')
              ? 'bg-accent-primary/20 border-s-2 border-accent-primary text-accent-primary-bright'
              : 'hover:bg-bg-tertiary hover:text-accent-primary-bright text-text-secondary'
              }`}
          >
            {t('nav.games')}
          </Link>

          {isAuthenticated && (
            <>
              <Link
                to="/library"
                className={`block px-4 py-2.5 font-pixel text-xs transition-all rounded ${isActive('/library')
                  ? 'bg-accent-primary/20 border-s-2 border-accent-primary text-accent-primary-bright'
                  : 'hover:bg-bg-tertiary hover:text-accent-primary-bright text-text-secondary'
                  }`}
              >
                {t('nav.library')}
              </Link>
              <Link
                to="/profile"
                className={`block px-4 py-2.5 font-pixel text-xs transition-all rounded ${isActive('/profile')
                  ? 'bg-accent-primary/20 border-s-2 border-accent-primary text-accent-primary-bright'
                  : 'hover:bg-bg-tertiary hover:text-accent-primary-bright text-text-secondary'
                  }`}
              >
                {t('nav.profile') || 'Profile'}
              </Link>
              {(user?.role === 'developer' || user?.role === 'admin') && (
                <Link
                  to="/dashboard"
                  className={`block px-4 py-2.5 font-pixel text-xs transition-all rounded ${isActive('/dashboard')
                    ? 'bg-accent-primary/20 border-s-2 border-accent-primary text-accent-primary-bright'
                    : 'hover:bg-bg-tertiary hover:text-accent-primary-bright text-text-secondary'
                    }`}
                >
                  {t('nav.dashboard')}
                </Link>
              )}
              {user?.role === 'admin' && (
                <>
                  <Link
                    to="/admin"
                    className={`block px-4 py-2.5 font-pixel text-xs transition-all rounded ${isActive('/admin')
                      ? 'bg-accent-primary/20 border-s-2 border-accent-primary text-accent-primary-bright'
                      : 'hover:bg-bg-tertiary hover:text-accent-primary-bright text-text-secondary'
                      }`}
                  >
                    {t('nav.admin')}
                  </Link>
                  <Link
                    to="/admin/categories"
                    className={`block px-4 py-2.5 font-pixel text-xs transition-all rounded ${isActive('/admin/categories')
                      ? 'bg-accent-primary/20 border-s-2 border-accent-primary text-accent-primary-bright'
                      : 'hover:bg-bg-tertiary hover:text-accent-primary-bright text-text-secondary'
                      }`}
                  >
                    {t('nav.categoryManagement')}
                  </Link>
                </>
              )}
            </>
          )}
        </nav>

        <div className="mt-auto space-y-4">
          {/* Language Switcher */}
          <div className="flex gap-2 border-t border-border-color pt-4">
            <button
              onClick={() => setLanguage('en')}
              className={`flex-1 py-2 font-pixel text-xs transition-all rounded ${language === 'en'
                ? 'bg-accent-primary/20 border border-accent-primary text-accent-primary-bright'
                : 'border border-border-color hover:border-accent-primary text-text-secondary'
                }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('ar')}
              className={`flex-1 py-2 font-pixel text-xs transition-all rounded ${language === 'ar'
                ? 'bg-accent-primary/20 border border-accent-primary text-accent-primary-bright'
                : 'border border-border-color hover:border-accent-primary text-text-secondary'
                }`}
            >
              AR
            </button>
          </div>

          {/* Auth Section */}
          {isAuthenticated ? (
            <div className="border-t-2 border-border-color pt-4">
              <RetroButton
                onClick={handleLogout}
                variant="danger"
                className="w-full"
              >
                {t('nav.logout')}
              </RetroButton>
            </div>
          ) : (
            <div className="space-y-2 border-t-2 border-border-color pt-4">
              <Link to="/login" className="block">
                <RetroButton variant="secondary" className="w-full">
                  {t('nav.login')}
                </RetroButton>
              </Link>
              <Link to="/register" className="block">
                <RetroButton variant="primary" className="w-full">
                  {t('nav.register')}
                </RetroButton>
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 ms-64">
        {children}
      </main>
    </div>
  );
};

export default Layout;
