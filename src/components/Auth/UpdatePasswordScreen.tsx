import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';

export function UpdatePasswordScreen() {
  const { t } = useTranslation();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    setLoading(true);
    const err = await updatePassword(password);
    setLoading(false);
    if (err) setError(err.message);
    else setSuccess(true);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-950">
      <div className="mb-8">
        <img src="/logo_mimoovie.png" alt="Mimoovie" className="h-12 w-auto" />
      </div>

      <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-2xl">
        <h2 className="text-lg font-semibold text-white mb-5">{t('auth.newPassword')}</h2>

        {success ? (
          <p className="text-sm text-green-400 text-center py-4">{t('auth.passwordChanged')}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t('auth.newPasswordPlaceholder')}
                required
                className="w-full bg-gray-800 text-white placeholder-gray-500 text-sm rounded-lg pl-9 pr-10 py-2.5 border border-gray-700 focus:outline-none focus:border-red-500 transition-colors"
              />
              <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <input
                type={showPwd ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder={t('auth.confirmPasswordPlaceholder')}
                required
                className="w-full bg-gray-800 text-white placeholder-gray-500 text-sm rounded-lg pl-9 pr-4 py-2.5 border border-gray-700 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? '...' : t('auth.savePassword')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
