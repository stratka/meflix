import { useState } from 'react';
import { X, Settings } from 'lucide-react';
import type { AppSettings } from '../../types/app';
import { RegionStep } from '../Setup/RegionStep';
import { ServicesStep } from '../Setup/ServicesStep';

interface Props {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
}

type Tab = 'services' | 'region';

export function SettingsPanel({ settings, onSave, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('services');
  const [draft, setDraft] = useState<AppSettings>({ ...settings });

  function handleRegion(region: string) {
    const next = { ...draft, region };
    setDraft(next);
    onSave(next);
    onClose();
  }

  function handleServices(selectedServices: string[]) {
    const next = { ...draft, selectedServices };
    onSave(next);
    onClose();
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'services', label: 'Služby' },
    { id: 'region', label: 'Region' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-white">Nastavení</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                tab === t.id
                  ? 'border-red-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {tab === 'region' && (
            <RegionStep onNext={handleRegion} initial={draft.region} />
          )}
          {tab === 'services' && (
            <ServicesStep
              onNext={handleServices}
              onBack={() => setTab('region')}
              initial={draft.selectedServices}
            />
          )}
        </div>
      </div>
    </div>
  );
}
