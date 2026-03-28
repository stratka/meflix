import { useState } from 'react';
import { Settings } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useCloudSettings } from './hooks/useCloudSettings';
import { useCloudWatched } from './hooks/useCloudWatched';
import { AuthScreen } from './components/Auth/AuthScreen';
import { SetupScreen } from './components/Setup/SetupScreen';
import { MovieBrowser } from './components/Movies/MovieBrowser';
import { WatchedScreen } from './components/Movies/WatchedScreen';
import { SettingsPanel } from './components/Settings/SettingsPanel';

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { settings, setSettings, synced } = useCloudSettings(user);
  const { watched, markWatched, unmarkWatched, isWatched } = useCloudWatched(user);
  const [showSettings, setShowSettings] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showWatched, setShowWatched] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  if (authLoading || (user && !synced)) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
          <span className="text-xs text-gray-600">v1.3.0</span>
          <button
            onClick={() => setShowSettings(true)}
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Nastavení"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <MovieBrowser
        settings={settings}
        user={user}
        resetKey={resetKey}
        watched={watched}
        markWatched={markWatched}
        unmarkWatched={unmarkWatched}
        isWatched={isWatched}
      />

      {showWatched && (
        <WatchedScreen
          watched={watched}
          onUnmark={unmarkWatched}
          onClose={() => setShowWatched(false)}
        />
      )}

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
