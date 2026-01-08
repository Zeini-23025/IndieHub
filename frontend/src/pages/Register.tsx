import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import RetroButton from '../components/RetroButton';
import RetroInput from '../components/RetroInput';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'user' | 'developer'>('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.passMatch'));
      return;
    }

    if (password.length < 8) {
      setError(t('auth.passLength'));
      return;
    }

    setLoading(true);

    try {
      await register(username, email, password, role);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.username?.[0] || t('auth.regFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-bg-secondary pixel-border p-8">
        <h2 className="font-pixel-xl text-accent-primary-bright mb-6 text-center crt-glow">
          {t('auth.register')}
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
            label={t('auth.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div>
            <label className="block mb-2 font-pixel text-xs text-text-secondary">
              {t('auth.role')}
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'user' | 'developer')}
              className="w-full px-4 py-3 bg-bg-tertiary border-2 border-border-color text-text-primary font-mono text-sm focus:outline-none focus:border-accent-red"
            >
              <option value="user">{t('auth.role.user')}</option>
              <option value="developer">{t('auth.role.developer')}</option>
            </select>
          </div>
          <RetroInput
            label={t('auth.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <RetroInput
            label={t('auth.confirmPassword')}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <RetroButton
            type="submit"
            disabled={loading}
            variant="primary"
            className="w-full"
          >
            {loading ? t('auth.registering').toUpperCase() : t('auth.register').toUpperCase()}
          </RetroButton>
        </form>
        <p className="mt-6 text-center text-sm text-text-secondary" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="text-accent-primary-bright hover:text-accent-primary-bright underline">
            {t('auth.login')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
