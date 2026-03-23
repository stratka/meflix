import { useState } from 'react';
import { Tv2 } from 'lucide-react';
import { STREAMING_SERVICES } from '../../utils/constants';

interface Props {
  onNext: (services: string[]) => void;
  onBack: () => void;
  initial?: string[];
}

export function ServicesStep({ onNext, onBack, initial = [] }: Props) {
  const [selected, setSelected] = useState<string[]>(initial);

  function toggle(id: string) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
          <Tv2 className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Tvoje služby</h2>
          <p className="text-sm text-gray-400">Vyber, co sleduješ</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-6">
        {STREAMING_SERVICES.map(service => {
          const isSelected = selected.includes(service.id);
          return (
            <button
              key={service.id}
              onClick={() => toggle(service.id)}
              className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all border-2 ${
                isSelected ? 'scale-[1.02]' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: isSelected ? service.color : 'transparent',
                borderColor: service.color,
                color: isSelected ? service.textColor : service.color,
              }}
            >
              {service.name}
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 rounded-lg transition-colors"
        >
          Zpět
        </button>
        <button
          onClick={() => onNext(selected)}
          disabled={selected.length === 0}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 rounded-lg transition-colors"
        >
          {selected.length === 0 ? 'Vyber aspoň jednu' : 'Hotovo!'}
        </button>
      </div>
    </div>
  );
}
