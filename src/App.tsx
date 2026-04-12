import { useState, useEffect } from 'react';
import { Settings, X, WifiOff, Share2, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './hooks/useAuth';
import { useCloudSettings } from './hooks/useCloudSettings';
import { useCloudWatched } from './hooks/useCloudWatched';
import { useOnline } from './hooks/useOnline';
import { AuthScreen } from './components/Auth/AuthScreen';
import { UpdatePasswordScreen } from './components/Auth/UpdatePasswordScreen';
import { SetupScreen } from './components/Setup/SetupScreen';
import { MovieBrowser } from './components/Movies/MovieBrowser';
import { WatchedScreen } from './components/Movies/WatchedScreen';
import { SettingsPanel } from './components/Settings/SettingsPanel';
import { RatingPrompt, shouldShowRating } from './components/common/RatingPrompt';

export default function App() {
  const { t } = useTranslation();
  const online = useOnline();
  const { user, loading: authLoading, isPasswordRecovery, signOut } = useAuth();
  const { settings, setSettings, synced } = useCloudSettings(user);
  const { watched, markWatched, unmarkWatched, isWatched } = useCloudWatched(user);
  const [showSettings, setShowSettings] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showWatched, setShowWatched] = useState(false);
  const [resetKey] = useState(0);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [showRating, setShowRating] = useState(false);

  const watchedCount = Object.keys(watched).length;
  useEffect(() => {
    if (watchedCount >= 5 && shouldShowRating()) {
      setShowRating(true);
    }
  }, [watchedCount]);

  if (authLoading || (user && !synced)) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isPasswordRecovery) return <UpdatePasswordScreen />;

  if (showAuth) return <AuthScreen onClose={() => setShowAuth(false)} />;

  if (!settings.region) {
    return <SetupScreen onComplete={setSettings} initial={settings} />;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Top navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <a
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            title="Domů"
          >
            <img src="/logo_mimoovie.png" alt="Mimoovie" className="h-10 md:h-12 w-auto" />
          </a>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">v1.8.0</span>
          <a
            href="/mimoovie.apk"
            download="mimoovie.apk"
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Stáhnout pro Android"
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            onClick={() => {
              const data = { title: 'Mimoovie', text: t('share.appText'), url: 'https://www.mimoovie.com' };
              if (navigator.share) navigator.share(data);
              else navigator.clipboard?.writeText('https://www.mimoovie.com');
            }}
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title={t('share.app')}
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Nastavení"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Offline banner */}
      {!online && (
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-gray-400 shrink-0" />
          <p className="text-sm text-gray-300">{t('banner.offline')}</p>
        </div>
      )}

      {/* Not-logged-in banner */}
      {!user && !bannerDismissed && (
        <div className="bg-amber-950/60 border-b border-amber-700/50 px-4 py-2.5 flex items-center justify-between gap-3">
          <p className="text-sm text-amber-200 flex-1">
            {t('banner.notLoggedIn')}{' '}
            <button
              onClick={() => { setShowAuth(true); }}
              className="underline font-semibold hover:text-white transition-colors"
            >
              {t('banner.signIn')}
            </button>
          </p>
          <button
            onClick={() => setBannerDismissed(true)}
            className="text-amber-400 hover:text-white shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <MovieBrowser
        settings={settings}
        user={user}
        resetKey={resetKey}
        watched={watched}
        markWatched={markWatched}
        unmarkWatched={unmarkWatched}
        isWatched={isWatched}
        onOpenSettings={() => setShowSettings(true)}
      />

      {showWatched && (
        <WatchedScreen
          watched={watched}
          onUnmark={unmarkWatched}
          onClose={() => setShowWatched(false)}
        />
      )}

      {showRating && <RatingPrompt onClose={() => setShowRating(false)} />}

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSave={setSettings}
          onClose={() => setShowSettings(false)}
          user={user}
          onSignIn={() => { setShowSettings(false); setShowAuth(true); }}
          onSignOut={signOut}
        />
      )}
    </div>
  );
}
