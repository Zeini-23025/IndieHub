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

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex">
      {/* Sidebar Navigation */}
      <aside className={`w-64 bg-bg-secondary border-e border-border-color p-6 flex flex-col fixed h-screen z-50 ${language === 'ar' ? 'right-0' : 'left-0'}`}>
        <Link to="/" className="mb-8">
          <h1 className="font-pixel-xl text-accent-primary-bright text-center crt-glow">
            {t('app.name')}
          </h1>
        </Link>

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
            <div className="space-y-2 border-t-2 border-border-color pt-4">
              <div className="px-4 py-2 text-xs text-text-secondary font-mono">
                {user?.username}
              </div>
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
