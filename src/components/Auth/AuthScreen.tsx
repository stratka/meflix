import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';

export function AuthScreen({ onClose }: { onClose?: () => void }) {
  const { t } = useTranslation();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    const err = mode === 'login'
      ? await signInWithEmail(email, password)
      : await signUpWithEmail(email, password);
    setLoading(false);
    if (err) {
      setError(err.message);
    } else if (mode === 'register') {
      setInfo(t('auth.checkEmail'));
    } else {
      onClose?.();
    }
  }

  async function handleGoogle() {
    setError('');
    await signInWithGoogle();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-950">
      <div className="mb-8">
        <img src="/logo_mimoovie.png" alt="Mimoovie" className="h-12 w-auto" />
      </div>

      <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-2xl">
        <h2 className="text-lg font-semibold text-white mb-5">
          {mode === 'login' ? t('auth.signIn') : t('auth.register')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="E-mail"
              required
              className="w-full bg-gray-800 text-white placeholder-gray-500 text-sm rounded-lg pl-9 pr-4 py-2.5 border border-gray-700 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t('auth.password')}
              required
              className="w-full bg-gray-800 text-white placeholder-gray-500 text-sm rounded-lg pl-9 pr-10 py-2.5 border border-gray-700 focus:outline-none focus:border-red-500 transition-colors"
            />
            <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
          {info && <p className="text-xs text-green-400">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? '...' : mode === 'login' ? t('auth.signIn') : t('auth.registerLink')}
          </button>
        </form>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-xs text-gray-600">{t('common.or')}</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        <button
          onClick={handleGoogle}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {t('auth.continueGoogle')}
        </button>

        <p className="text-center text-xs text-gray-600 mt-5">
          {mode === 'login' ? t('auth.noAccount') : t('auth.haveAccount')}
          {' '}
          <button onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); setInfo(''); }} className="text-red-400 hover:text-red-300">
            {mode === 'login' ? t('auth.registerLink') : t('auth.signInLink')}
          </button>
        </p>
      </div>
    </div>
  );
}
