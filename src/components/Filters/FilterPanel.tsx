import { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, SlidersHorizontal, Eye, Check, Bookmark } from 'lucide-react';
import type { Genre } from '../../types/tmdb';
import type { FilterState, SortOption } from '../../types/app';
import { SORT_OPTIONS } from '../../utils/constants';
import { searchPerson } from '../../utils/tmdb';

interface Props {
  filters: FilterState;
  genres: Genre[];
  onChange: (filters: FilterState) => void;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

const CURRENT_YEAR = new Date().getFullYear();

const COUNTRIES = [
  { code: '', name: 'Všechny země' },
  { code: 'US', name: '🇺🇸 USA' },
  { code: 'GB', name: '🇬🇧 Velká Británie' },
  { code: 'FR', name: '🇫🇷 Francie' },
  { code: 'DE', name: '🇩🇪 Německo' },
  { code: 'IT', name: '🇮🇹 Itálie' },
  { code: 'ES', name: '🇪🇸 Španělsko' },
  { code: 'CZ', name: '🇨🇿 Česká republika' },
  { code: 'SK', name: '🇸🇰 Slovensko' },
  { code: 'PL', name: '🇵🇱 Polsko' },
  { code: 'AT', name: '🇦🇹 Rakousko' },
  { code: 'SE', name: '🇸🇪 Švédsko' },
  { code: 'DK', name: '🇩🇰 Dánsko' },
  { code: 'NO', name: '🇳🇴 Norsko' },
  { code: 'JP', name: '🇯🇵 Japonsko' },
  { code: 'KR', name: '🇰🇷 Jižní Korea' },
  { code: 'IN', name: '🇮🇳 Indie' },
  { code: 'CN', name: '🇨🇳 Čína' },
  { code: 'AU', name: '🇦🇺 Austrálie' },
  { code: 'CA', name: '🇨🇦 Kanada' },
  { code: 'BR', name: '🇧🇷 Brazílie' },
  { code: 'MX', name: '🇲🇽 Mexiko' },
  { code: 'IR', name: '🇮🇷 Írán' },
  { code: 'RU', name: '🇷🇺 Rusko' },
  { code: 'TR', name: '🇹🇷 Turecko' },
];

export function FilterPanel({ filters, genres, onChange, mobileOpen: externalMobileOpen, onMobileOpenChange }: Props) {
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const mobileOpen = externalMobileOpen !== undefined ? externalMobileOpen : internalMobileOpen;
  const setMobileOpen = (v: boolean) => { setInternalMobileOpen(v); onMobileOpenChange?.(v); };
  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const [personQuery, setPersonQuery] = useState(filters.personName);
  const [personResults, setPersonResults] = useState<{ id: number; name: string; dept: string }[]>([]);
  const [personSearchLoading, setPersonSearchLoading] = useState(false);
  const personTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Person search with debounce
  useEffect(() => {
    if (personTimeout.current) clearTimeout(personTimeout.current);
    if (!personQuery.trim() || personQuery === filters.personName) {
      setPersonResults([]);
      return;
    }
    personTimeout.current = setTimeout(async () => {
      setPersonSearchLoading(true);
      try {
        const res = await searchPerson(personQuery);
        setPersonResults(
          res.results.slice(0, 6).map(p => ({
            id: p.id,
            name: p.name,
            dept: p.known_for_department,
          }))
        );
      } catch { /* ignore */ }
      finally { setPersonSearchLoading(false); }
    }, 400);
  }, [personQuery, filters.personName]);

  function selectPerson(id: number, name: string, dept: string) {
    setPersonQuery(name);
    setPersonResults([]);
    onChange({
      ...filters,
      personId: id,
      personName: name,
      personRole: dept === 'Directing' ? 'crew' : 'cast',
    });
  }

  function clearPerson() {
    setPersonQuery('');
    setPersonResults([]);
    onChange({ ...filters, personId: null, personName: '', personRole: 'cast' });
  }

  function toggleGenre(id: number) {
    const genres = filters.genres.includes(id)
      ? filters.genres.filter(g => g !== id)
      : [...filters.genres, id];
    onChange({ ...filters, genres });
  }

  // Zavři mobilní filtr při odscrollování mimo viewport
  useEffect(() => {
    if (!mobileOpen) return;
    const el = mobileContainerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (!entry.isIntersecting) setMobileOpen(false); },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [mobileOpen]);

  const activeFilterCount = [
    filters.genres.length > 0,
    filters.minRating > 0,
    filters.yearFrom > 1950,
    filters.yearTo < CURRENT_YEAR,
    filters.personId !== null,
    filters.watchedFilter !== 'all',
    filters.watchlistFilter !== 'all',
    filters.originCountry !== '',
    filters.certification !== '',
  ].filter(Boolean).length;

  const panelContent = (
    <div className="space-y-6">
      {/* Shlédnuté filmy */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Shlédnuté filmy</span>
        </label>
        <div className="flex rounded-lg overflow-hidden border border-gray-700">
          {([
            { value: 'all', label: 'Vše' },
            { value: 'hide', label: 'Skrýt' },
            { value: 'only', label: 'Jen shlédnuté' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...filters, watchedFilter: opt.value })}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                filters.watchedFilter === opt.value
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chci vidět */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          <span className="flex items-center gap-1"><Bookmark className="w-3.5 h-3.5" /> Chci vidět</span>
        </label>
        <div className="flex rounded-lg overflow-hidden border border-gray-700">
          {([
            { value: 'all', label: 'Vše' },
            { value: 'hide', label: 'Skrýt' },
            { value: 'only', label: 'Jen chci vidět' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...filters, watchlistFilter: opt.value })}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                filters.watchlistFilter === opt.value
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Certification / věkové hodnocení */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Věkové hodnocení
        </label>
        <div className="relative">
          <select
            value={filters.certification}
            onChange={e => onChange({ ...filters, certification: e.target.value as FilterState['certification'] })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-red-500 pr-8"
          >
            <option value="">Vše</option>
            <option value="G">Pro nejmenší (G)</option>
            <option value="PG">Děti 7+ (G, PG)</option>
            <option value="PG-13">Mládež 12+ (G, PG, PG-13)</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Media type */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Typ obsahu
        </label>
        <div className="flex rounded-lg overflow-hidden border border-gray-700">
          {(['movie', 'tv'] as const).map(type => (
            <button
              key={type}
              onClick={() => onChange({ ...filters, mediaType: type })}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                filters.mediaType === type
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {type === 'movie' ? '🎬 Filmy' : '📺 Seriály'}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Řazení
        </label>
        <div className="relative">
          <select
            value={filters.sortBy}
            onChange={e => onChange({ ...filters, sortBy: e.target.value as SortOption })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-red-500 pr-8"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Person search */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Herec / Režisér
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={personQuery}
            onChange={e => setPersonQuery(e.target.value)}
            placeholder="Jméno osoby..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-9 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
          />
          {(personQuery || filters.personId) && (
            <button
              onClick={clearPerson}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {personResults.length > 0 && (
          <div className="mt-1 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-xl z-10">
            {personResults.map(p => (
              <button
                key={p.id}
                onClick={() => selectPerson(p.id, p.name, p.dept)}
                className="w-full text-left px-3 py-2 hover:bg-gray-700 text-sm text-white flex justify-between items-center"
              >
                <span>{p.name}</span>
                <span className="text-xs text-gray-500">{p.dept}</span>
              </button>
            ))}
          </div>
        )}
        {personSearchLoading && (
          <p className="text-xs text-gray-500 mt-1">Hledám...</p>
        )}
        {filters.personId && (
          <p className="text-xs text-green-400 mt-1">
            Filtrováno podle: <strong>{filters.personName}</strong>
          </p>
        )}
      </div>

      {/* Min rating */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Minimální hodnocení: <span className="text-white">{filters.minRating > 0 ? filters.minRating.toFixed(1) : 'vše'}</span>
        </label>
        <input
          type="range"
          min={0}
          max={9}
          step={0.5}
          value={filters.minRating}
          onChange={e => onChange({ ...filters, minRating: parseFloat(e.target.value) })}
          className="w-full accent-red-500"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Vše</span>
          <span>9.0</span>
        </div>
      </div>

      {/* Origin country */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Země původu
        </label>
        <div className="relative">
          <select
            value={filters.originCountry}
            onChange={e => onChange({ ...filters, originCountry: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-red-500 pr-8"
          >
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Year range */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Rok vydání: <span className="text-white">{filters.yearFrom} – {filters.yearTo}</span>
        </label>
        <div className="relative mt-3 mb-1">
          {/* Track */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-gray-700 rounded-full pointer-events-none">
            <div
              className="absolute h-full bg-red-500 rounded-full"
              style={{
                left: `${((filters.yearFrom - 1950) / (CURRENT_YEAR - 1950)) * 100}%`,
                right: `${((CURRENT_YEAR - filters.yearTo) / (CURRENT_YEAR - 1950)) * 100}%`,
              }}
            />
          </div>
          <div className="dual-range">
            <input
              type="range"
              min={1950}
              max={CURRENT_YEAR}
              step={1}
              value={filters.yearFrom}
              onChange={e => { const v = parseInt(e.target.value); onChange({ ...filters, yearFrom: v, yearTo: Math.max(v, filters.yearTo) }); }}
            />
            <input
              type="range"
              min={1950}
              max={CURRENT_YEAR}
              step={1}
              value={filters.yearTo}
              onChange={e => { const v = parseInt(e.target.value); onChange({ ...filters, yearTo: v, yearFrom: Math.min(v, filters.yearFrom) }); }}
            />
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1950</span>
          <span>{CURRENT_YEAR}</span>
        </div>
      </div>

      {/* Genres */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Žánr
        </label>
        <div className="flex flex-wrap gap-2">
          {genres.map(genre => {
            const active = filters.genres.includes(genre.id);
            return (
              <button
                key={genre.id}
                onClick={() => toggleGenre(genre.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  active
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {genre.name}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Mobile filter dropdown */}
      {mobileOpen && (
        <div ref={mobileContainerRef} className="lg:hidden px-4 pb-3 bg-gray-900/95 border-b border-gray-800">
          <button
            onClick={() => setMobileOpen(false)}
            className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
            aria-label="Zavřít filtry"
          >
            <Check className="w-5 h-5" />
          </button>
          {panelContent}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-4 bg-gray-900 border border-gray-800 rounded-xl p-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
          <h2 className="font-semibold text-white flex items-center gap-2 mb-4">
            <SlidersHorizontal className="w-4 h-4" />
            Filtry
            {activeFilterCount > 0 && (
              <span className="bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {activeFilterCount}
              </span>
            )}
          </h2>
          {panelContent}
        </div>
      </aside>
    </>
  );
}
