import { useState } from 'react';
import { Globe } from 'lucide-react';
import { REGIONS } from '../../utils/constants';

interface Props {
  onNext: (region: string) => void;
  onBack?: () => void;
  initial?: string;
}

export function RegionStep({ onNext, onBack, initial = 'CZ' }: Props) {
  const [region, setRegion] = useState(initial);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
          <Globe className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Tvoje země</h2>
          <p className="text-sm text-gray-400">Filtruje dostupnost na streamovacích službách</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-6">
        {REGIONS.map(r => (
          <button
            key={r.code}
            onClick={() => setRegion(r.code)}
            className={`px-4 py-3 rounded-lg text-sm font-medium text-left transition-colors border ${
              region === r.code
                ? 'bg-red-600/20 border-red-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
            }`}
          >
            {r.name}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 rounded-lg transition-colors"
          >
            Zpět
          </button>
        )}
        <button
          onClick={() => onNext(region)}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors"
        >
          Pokračovat
        </button>
      </div>
    </div>
  );
}
