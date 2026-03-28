import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { STREAMING_SERVICES } from '../../utils/constants';
import { fetchRegionProviderIds } from '../../utils/tmdb';
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
  const [selected, setSelected] = useState<string[]>(initial);
  const [localIds, setLocalIds] = useState<Set<number>>(new Set());
  const [loadingLocal, setLoadingLocal] = useState(true);
  const [showForeign, setShowForeign] = useState(false);

  useEffect(() => {
    setLoadingLocal(true);
    fetchRegionProviderIds(region)
      .then(ids => setLocalIds(ids))
      .catch(() => setLocalIds(new Set()))
      .finally(() => setLoadingLocal(false));
  }, [region]);

  function toggle(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  const localServices = STREAMING_SERVICES.filter(s =>
    s.tmdbId && localIds.has(s.tmdbId) ||
    s.tmdbIds?.some(id => localIds.has(id))
  );

  const foreignServices = STREAMING_SERVICES.filter(s =>
    !localServices.includes(s)
  );

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Tvoje služby</h2>
        <p className="text-sm text-gray-400">Služby dostupné ve tvém regionu</p>
      </div>

      {loadingLocal ? (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-11 rounded-lg bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : localServices.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 mb-4">
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
        <p className="text-sm text-gray-500 mb-4">Nepodařilo se načíst služby pro tento region.</p>
      )}

      {foreignServices.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowForeign(v => !v)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-3"
          >
            {showForeign ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Přidat zahraniční služby
          </button>
          {showForeign && (
            <div className="grid grid-cols-2 gap-2">
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
          Zpět
        </button>
        <button
          onClick={() => onNext(selected)}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors"
        >
          Hotovo!
        </button>
      </div>
    </div>
  );
}
