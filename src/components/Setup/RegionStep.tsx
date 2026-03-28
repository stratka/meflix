import { useState } from 'react';
import { Globe, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { REGIONS } from '../../utils/constants';

interface Props {
  onNext: (region: string) => void;
  onBack?: () => void;
  initial?: string;
}

export function RegionStep({ onNext, onBack, initial = 'CZ' }: Props) {
  const { t } = useTranslation();
  const [region, setRegion] = useState(initial);
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? REGIONS.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.code.toLowerCase().includes(search.toLowerCase())
      )
    : REGIONS;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
          <Globe className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">{t('region.title')}</h2>
          <p className="text-sm text-gray-400">{t('region.subtitle')}</p>
        </div>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('region.searchPlaceholder')}
          className="w-full bg-gray-800 text-white placeholder-gray-500 text-sm rounded-lg pl-9 pr-4 py-2.5 border border-gray-700 focus:outline-none focus:border-red-500 transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 max-h-72 overflow-y-auto pr-1">
        {filtered.map(r => (
          <button
            key={r.code}
            onClick={() => setRegion(r.code)}
            className={`px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors border ${
              region === r.code
                ? 'bg-red-600/20 border-red-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
            }`}
          >
            <span className="text-gray-500 text-xs mr-1">{r.code}</span>
            {r.name}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-2 text-center text-sm text-gray-500 py-4">{t('region.notFound')}</p>
        )}
      </div>

      <div className="flex gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 rounded-lg transition-colors"
          >
            {t('common.back')}
          </button>
        )}
        <button
          onClick={() => onNext(region)}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors"
        >
          {t('common.continue')}
        </button>
      </div>
    </div>
  );
}
