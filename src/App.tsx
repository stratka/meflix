import { useState } from 'react';
import { Settings } from 'lucide-react';
import type { AppSettings } from './types/app';
import { useLocalStorage } from './hooks/useLocalStorage';
import { SetupScreen } from './components/Setup/SetupScreen';
import { MovieBrowser } from './components/Movies/MovieBrowser';
import { SettingsPanel } from './components/Settings/SettingsPanel';

const EMPTY_SETTINGS: AppSettings = {
  region: 'CZ',
  selectedServices: [],
};

function isSetupComplete(settings: AppSettings): boolean {
  return !!(settings.region && settings.selectedServices.length > 0);
}

export default function App() {
  const [settings, setSettings] = useLocalStorage<AppSettings>('streampicker-settings', EMPTY_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);

  if (!isSetupComplete(settings)) {
    return <SetupScreen onComplete={setSettings} initial={settings} />;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Top navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <img src="/favicon.svg" alt="MEFLIX logo" className="w-16 h-16 rounded-lg" />
          <span className="text-lg font-bold text-white tracking-tight">MEFLIX</span>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          title="Nastavení"
        >
          <Settings className="w-5 h-5" />
        </button>
      </nav>

      <MovieBrowser settings={settings} />

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
