import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { STREAMING_SERVICES, createDynamicService } from '../../utils/constants';
import { fetchRegionProviders } from '../../utils/tmdb';
import type { StreamingService } from '../../types/app';

interface Props {
  onNext: (services: string[]) => void;
  onBack: () => void;
  initial?: string[];
  region: string;
}

function ServiceButton({ service, selected, onToggle }: { service: StreamingService; selected: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all border-2 ${
        selected ? 'scale-[1.02]' : 'opacity-70 hover:opacity-100'
      }`}
      style={{
        backgroundColor: selected ? service.color : 'transparent',
        borderColor: service.color,
        color: selected ? service.textColor : service.color,
      }}
    >
      {service.name}
    </button>
  );
}

export function ServicesStep({ onNext, onBack, initial = [], region }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string[]>(initial);
  const [localServices, setLocalServices] = useState<StreamingService[]>([]);
  const [loadingLocal, setLoadingLocal] = useState(true);
  const [showForeign, setShowForeign] = useState(false);

  useEffect(() => {
    setLoadingLocal(true);
    fetchRegionProviders(region)
      .then(providers => {
        const services = providers.map(p => {
          const known = STREAMING_SERVICES.find(s =>
            s.tmdbId === p.id || s.tmdbIds?.includes(p.id)
          );
          return known ?? createDynamicService(p.id, p.name);
        });
        setLocalServices(services);
      })
      .catch(() => setLocalServices([]))
      .finally(() => setLoadingLocal(false));
  }, [region]);

  function toggle(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  const localIds = new Set(localServices.map(s => s.id));
  const foreignServices = STREAMING_SERVICES.filter(s => !localIds.has(s.id));

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">{t('services.title')}</h2>
        <p className="text-sm text-gray-400">{t('services.subtitle')}</p>
      </div>

      {loadingLocal ? (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-11 rounded-lg bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : localServices.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 mb-4 max-h-64 overflow-y-auto pr-1">
          {localServices.map(service => (
            <ServiceButton
              key={service.id}
              service={service}
              selected={selected.includes(service.id)}
              onToggle={() => toggle(service.id)}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 mb-4">{t('services.loadError')}</p>
      )}

      {foreignServices.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowForeign(v => !v)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-3"
          >
            {showForeign ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {t('services.addForeign')}
          </button>
          {showForeign && (
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {foreignServices.map(service => (
                <ServiceButton
                  key={service.id}
                  service={service}
                  selected={selected.includes(service.id)}
                  onToggle={() => toggle(service.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 rounded-lg transition-colors"
        >
          {t('common.back')}
        </button>
        <button
          onClick={() => onNext(selected)}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors"
        >
          {t('common.done')}
        </button>
      </div>
    </div>
  );
}
