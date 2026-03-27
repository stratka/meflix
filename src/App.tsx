import { useState } from 'react';
import { Settings, LogOut } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useCloudSettings } from './hooks/useCloudSettings';
import { AuthScreen } from './components/Auth/AuthScreen';
import { SetupScreen } from './components/Setup/SetupScreen';
import { MovieBrowser } from './components/Movies/MovieBrowser';
import { SettingsPanel } from './components/Settings/SettingsPanel';

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { settings, setSettings, synced } = useCloudSettings(user);
  const [showSettings, setShowSettings] = useState(false);

  if (authLoading || (user && !synced)) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  if (!settings.region) {
    return <SetupScreen onComplete={setSettings} initial={settings} />;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Top navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <img src="/favicon.svg" alt="MEFLIX logo" className="w-8 h-8 rounded-lg" />
          <span className="text-lg font-bold text-white tracking-tight">MEFLIX</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-600">v1.1.0</span>
          <span className="text-xs text-gray-500 hidden sm:block truncate max-w-[140px]">{user.email}</span>
          <button
            onClick={() => setShowSettings(true)}
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Nastavení"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={signOut}
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Odhlásit se"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <MovieBrowser settings={settings} user={user} />

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSave={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
