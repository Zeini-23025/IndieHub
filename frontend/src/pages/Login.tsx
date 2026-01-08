import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import RetroButton from '../components/RetroButton';
import RetroInput from '../components/RetroInput';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-bg-secondary pixel-border p-8">
        <h2 className="font-pixel-xl text-accent-primary-bright mb-6 text-center crt-glow">
          {t('auth.login')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-error/20 border border-error text-error px-4 py-3 font-pixel text-xs rounded">
              {error}
            </div>
          )}
          <RetroInput
            label={t('auth.username')}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <RetroInput
            label={t('auth.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <RetroButton
            type="submit"
            disabled={loading}
            variant="primary"
            className="w-full"
          >
            {loading ? t('auth.loggingIn').toUpperCase() : t('auth.login').toUpperCase()}
          </RetroButton>
        </form>
        <p className="mt-6 text-center text-sm text-text-secondary" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-accent-primary-bright hover:text-accent-primary-bright underline">
            {t('auth.register')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
