import { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, SlidersHorizontal, Eye, Bookmark, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  totalResults?: number;
}

const CURRENT_YEAR = new Date().getFullYear();

const COUNTRY_CODES = ['', 'US', 'GB', 'FR', 'DE', 'IT', 'ES', 'CZ', 'SK', 'PL', 'AT', 'SE', 'DK', 'NO', 'JP', 'KR', 'IN', 'CN', 'AU', 'CA', 'BR', 'MX', 'IR', 'RU', 'TR'];

const GENRE_ICONS: Record<number, string> = {
  28: '⚔️', 12: '🗺️', 16: '🎨', 35: '😂', 80: '🔫',
  99: '🎥', 18: '🎭', 10751: '👨‍👩‍👧', 14: '🏰', 36: '🏛️',
  27: '💀', 10402: '🎵', 9648: '🔍', 10749: '❤️', 878: '🚀',
  53: '😰', 10752: '🎖️', 37: '🤠',
};

const QUICK_PERSONS = [
  { id: 525, name: 'Nolan', fullName: 'Christopher Nolan', dept: 'Directing' },
  { id: 6193, name: 'DiCaprio', fullName: 'Leonardo DiCaprio', dept: 'Acting' },
  { id: 55428, name: 'Villeneuve', fullName: 'Denis Villeneuve', dept: 'Directing' },
  { id: 138, name: 'Tarantino', fullName: 'Quentin Tarantino', dept: 'Directing' },
];

export function FilterPanel({ filters, genres, onChange, mobileOpen: externalMobileOpen, onMobileOpenChange, totalResults }: Props) {
  const { t, i18n } = useTranslation();
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const mobileOpen = externalMobileOpen !== undefined ? externalMobileOpen : internalMobileOpen;
  const setMobileOpen = (v: boolean) => { setInternalMobileOpen(v); onMobileOpenChange?.(v); };
  const [advancedOpen, setAdvancedOpen] = useState(true);
  const [genreModalOpen, setGenreModalOpen] = useState(false);
  const [personQuery, setPersonQuery] = useState(filters.personName);
  const [personResults, setPersonResults] = useState<{ id: number; name: string; dept: string }[]>([]);
  const [personSearchLoading, setPersonSearchLoading] = useState(false);
  const personTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const countryDisplayNames = new Intl.DisplayNames([i18n.language], { type: 'region' });

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
        setPersonResults(res.results.slice(0, 6).map(p => ({ id: p.id, name: p.name, dept: p.known_for_department })));
      } catch { /* ignore */ }
      finally { setPersonSearchLoading(false); }
    }, 400);
  }, [personQuery, filters.personName]);

  function selectPerson(id: number, name: string, dept: string) {
    setPersonQuery(name);
    setPersonResults([]);
    onChange({ ...filters, personId: id, personName: name, personRole: dept === 'Directing' ? 'crew' : 'cast' });
  }

  function clearPerson() {
    setPersonQuery('');
    setPersonResults([]);
    onChange({ ...filters, personId: null, personName: '', personRole: 'cast' });
  }

  function toggleGenre(id: number) {
    const next = filters.genres.includes(id)
      ? filters.genres.filter(g => g !== id)
      : [...filters.genres, id];
    onChange({ ...filters, genres: next });
  }

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

  const selectedGenres = genres.filter(g => filters.genres.includes(g.id));

  const mobilePanel = (
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col overflow-hidden">

      {/* Genre popup modal */}
      {genreModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={() => setGenreModalOpen(false)}>
          <div className="w-full max-h-[80vh] bg-gray-900 rounded-t-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800 flex-shrink-0">
              <h3 className="font-semibold text-white">{t('filter.genre')}</h3>
              <div className="flex items-center gap-2">
                {filters.genres.length > 0 && (
                  <button onClick={() => onChange({ ...filters, genres: [] })} className="text-xs text-red-400 hover:text-red-300">
                    {t('filter.ratingAll')}
                  </button>
                )}
                <button onClick={() => setGenreModalOpen(false)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white rounded-lg hover:bg-gray-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto p-4 grid grid-cols-2 gap-2">
              {genres.map(genre => {
                const active = filters.genres.includes(genre.id);
                return (
                  <button
                    key={genre.id}
                    onClick={() => toggleGenre(genre.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'bg-red-600/20 border border-red-500/60 text-white'
                        : 'bg-gray-800 border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white'
                    }`}
                  >
                    <span className="text-base">{GENRE_ICONS[genre.id] ?? '🎞️'}</span>
                    <span className="truncate">{genre.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="px-4 py-3 border-t border-gray-800 flex-shrink-0">
              <button
                onClick={() => setGenreModalOpen(false)}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition-colors"
              >
                {filters.genres.length > 0
                  ? `${t('filter.genre')}: ${filters.genres.length} ✓`
                  : t('filter.showResultsSimple')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-5">

        {/* Upřesnění – vždy viditelné */}
        <section>
          <div className="space-y-4">
              {/* Řazení + Věkové hodnocení */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">{t('filter.sort')}</p>
                  <div className="relative">
                    <select
                      value={filters.sortBy}
                      onChange={e => onChange({ ...filters, sortBy: e.target.value as SortOption })}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white appearance-none focus:outline-none focus:border-red-500 pr-7"
                    >
                      {SORT_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>
                          {t(`sort.${o.value.replace(/\./g, '_')}`)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">{t('filter.ageRating')}</p>
                  <div className="relative">
                    <select
                      value={filters.certification}
                      onChange={e => onChange({ ...filters, certification: e.target.value as FilterState['certification'] })}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white appearance-none focus:outline-none focus:border-red-500 pr-7"
                    >
                      <option value="">{t('filter.ratingAll')}</option>
                      <option value="G">{t('filter.forKids')}</option>
                      <option value="PG">{t('filter.children')}</option>
                      <option value="PG-13">{t('filter.youth')}</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              {/* Minimální hodnocení */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500">{t('filter.minRating', { value: filters.minRating > 0 ? filters.minRating.toFixed(1) : t('filter.minRatingAll') })}</p>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <span key={i} className={`text-base ${filters.minRating >= i * 2 - 1 ? 'text-yellow-400' : filters.minRating >= i * 2 - 1.5 ? 'text-yellow-400/50' : 'text-gray-700'}`}>★</span>
                    ))}
                  </div>
                </div>
                <input type="range" min={0} max={9} step={0.5} value={filters.minRating}
                  onChange={e => onChange({ ...filters, minRating: parseFloat(e.target.value) })}
                  className="w-full accent-red-500" />
                <div className="flex justify-between text-xs text-gray-600 mt-1"><span>{t('filter.ratingAll')}</span><span>9.0</span></div>
              </div>
              {/* Rok vydání */}
              <div>
                <p className="text-xs text-gray-500 mb-2">{t('filter.yearRange', { from: filters.yearFrom, to: filters.yearTo })}</p>
                <div className="relative mt-3 mb-1">
                  <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-gray-800 rounded-full pointer-events-none">
                    <div className="absolute h-full bg-red-500 rounded-full"
                      style={{ left: `${((filters.yearFrom - 1950) / (CURRENT_YEAR - 1950)) * 100}%`, right: `${((CURRENT_YEAR - filters.yearTo) / (CURRENT_YEAR - 1950)) * 100}%` }} />
                  </div>
                  <div className="dual-range">
                    <input type="range" min={1950} max={CURRENT_YEAR} step={1} value={filters.yearFrom}
                      onChange={e => { const v = parseInt(e.target.value); onChange({ ...filters, yearFrom: v, yearTo: Math.max(v, filters.yearTo) }); }} />
                    <input type="range" min={1950} max={CURRENT_YEAR} step={1} value={filters.yearTo}
                      onChange={e => { const v = parseInt(e.target.value); onChange({ ...filters, yearTo: v, yearFrom: Math.min(v, filters.yearFrom) }); }} />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-1"><span>1950</span><span>{CURRENT_YEAR}</span></div>
              </div>
              {/* Země původu */}
              <div>
                <div className="relative">
                  <select value={filters.originCountry} onChange={e => onChange({ ...filters, originCountry: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-red-500 pr-8">
                    {COUNTRY_CODES.map(code => (
                      <option key={code} value={code}>{code === '' ? t('filter.allCountries') : countryDisplayNames.of(code) ?? code}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
        </section>

        {/* Váš výběr */}
        <section>
          <div className="space-y-2.5">
            <div>
              <p className="text-xs text-gray-500 mb-1.5">{t('filter.watched')}</p>
              <div className="flex rounded-xl overflow-hidden border border-gray-800">
                {([
                  { value: 'all', label: t('filter.all') },
                  { value: 'hide', label: t('filter.hide') },
                  { value: 'only', label: t('filter.onlyWatched') },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => onChange({ ...filters, watchedFilter: opt.value })}
                    className={`flex-1 py-2 text-xs font-medium transition-colors ${filters.watchedFilter === opt.value ? 'bg-red-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1.5">{t('filter.watchlist')}</p>
              <div className="flex rounded-xl overflow-hidden border border-gray-800">
                {([
                  { value: 'all', label: t('filter.all') },
                  { value: 'hide', label: t('filter.hide') },
                  { value: 'only', label: t('filter.onlyWatchlist') },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => onChange({ ...filters, watchlistFilter: opt.value })}
                    className={`flex-1 py-2 text-xs font-medium transition-colors ${filters.watchlistFilter === opt.value ? 'bg-red-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Co hledáte */}
        <section>
          {/* Typ obsahu */}
          <div className="flex gap-2 mb-4">
            {(['movie', 'tv'] as const).map(type => (
              <button
                key={type}
                onClick={() => onChange({ ...filters, mediaType: type, genres: [] })}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-colors ${filters.mediaType === type ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-gray-800 bg-gray-900 text-gray-400'}`}
              >
                <span className="text-2xl">{type === 'movie' ? '🎬' : '📺'}</span>
                <span className="text-xs font-medium">{type === 'movie' ? t('filter.movies') : t('filter.series')}</span>
              </button>
            ))}
          </div>

          {/* Žánry – tlačítko → popup */}
          <button
            onClick={() => setGenreModalOpen(true)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-600 transition-colors"
          >
            <span className="text-sm text-gray-300">
              {filters.genres.length > 0
                ? selectedGenres.map(g => `${GENRE_ICONS[g.id] ?? '🎞️'} ${g.name}`).join(', ')
                : t('filter.genre')}
            </span>
            <span className="flex items-center gap-1.5 flex-shrink-0 ml-2">
              {filters.genres.length > 0 && (
                <span className="bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">{filters.genres.length}</span>
              )}
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </span>
          </button>
        </section>

        {/* Osoby */}
        <section>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">{t('filter.personSearch')}</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={personQuery}
              onChange={e => setPersonQuery(e.target.value)}
              placeholder={t('filter.personPlaceholder')}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500"
            />
            {(personQuery || filters.personId) && (
              <button onClick={clearPerson} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {personResults.length > 0 && (
            <div className="mt-1 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
              {personResults.map(p => (
                <button key={p.id} onClick={() => selectPerson(p.id, p.name, p.dept)}
                  className="w-full text-left px-3 py-2.5 hover:bg-gray-800 text-sm text-white flex justify-between items-center border-b border-gray-800 last:border-0"
                >
                  <span>{p.name}</span>
                  <span className="text-xs text-gray-500">{p.dept}</span>
                </button>
              ))}
            </div>
          )}
          {personSearchLoading && <p className="text-xs text-gray-500 mt-1">{t('filter.searching')}</p>}
          {filters.personId && <p className="text-xs text-green-400 mt-1">{t('filter.filteredBy', { name: filters.personName })}</p>}

          {/* Quick persons */}
          {!filters.personId && (
            <div className="flex flex-wrap gap-2 mt-2">
              {QUICK_PERSONS.map(p => (
                <button
                  key={p.id}
                  onClick={() => selectPerson(p.id, p.fullName, p.dept)}
                  className="px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-full text-xs text-gray-300 hover:border-gray-600 hover:text-white transition-colors"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Bottom CTA */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-gray-800 bg-gray-950">
        <button
          onClick={() => setMobileOpen(false)}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-2xl transition-colors shadow-lg shadow-emerald-500/20"
        >
          <span>
            {totalResults !== undefined && totalResults > 0
              ? t('filter.showResults', { count: totalResults })
              : t('filter.showResultsSimple')}
          </span>
          <Sparkles className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // Desktop sidebar (zachován původní styl)
  const desktopPanel = (
    <div className="space-y-5">
      {/* Watched */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {t('filter.watched')}</span>
        </label>
        <div className="flex rounded-lg overflow-hidden border border-gray-700">
          {([{ value: 'all', label: t('filter.all') }, { value: 'hide', label: t('filter.hide') }, { value: 'only', label: t('filter.onlyWatched') }] as const).map(opt => (
            <button key={opt.value} onClick={() => onChange({ ...filters, watchedFilter: opt.value })}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${filters.watchedFilter === opt.value ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
            >{opt.label}</button>
          ))}
        </div>
      </div>

      {/* Watchlist */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          <span className="flex items-center gap-1"><Bookmark className="w-3.5 h-3.5" /> {t('filter.watchlist')}</span>
        </label>
        <div className="flex rounded-lg overflow-hidden border border-gray-700">
          {([{ value: 'all', label: t('filter.all') }, { value: 'hide', label: t('filter.hide') }, { value: 'only', label: t('filter.onlyWatchlist') }] as const).map(opt => (
            <button key={opt.value} onClick={() => onChange({ ...filters, watchlistFilter: opt.value })}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${filters.watchlistFilter === opt.value ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
            >{opt.label}</button>
          ))}
        </div>
      </div>

      {/* Media type */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('filter.contentType')}</label>
        <div className="flex rounded-lg overflow-hidden border border-gray-700">
          {(['movie', 'tv'] as const).map(type => (
            <button key={type} onClick={() => onChange({ ...filters, mediaType: type, genres: [] })}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${filters.mediaType === type ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
            >{type === 'movie' ? t('filter.movies') : t('filter.series')}</button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('filter.sort')}</label>
        <div className="relative">
          <select value={filters.sortBy} onChange={e => onChange({ ...filters, sortBy: e.target.value as SortOption })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-red-500 pr-8">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{t(`sort.${o.value.replace(/\./g, '_')}`)}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Certification */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('filter.ageRating')}</label>
        <div className="relative">
          <select value={filters.certification} onChange={e => onChange({ ...filters, certification: e.target.value as FilterState['certification'] })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-red-500 pr-8">
            <option value="">{t('filter.ratingAll')}</option>
            <option value="G">{t('filter.forKids')}</option>
            <option value="PG">{t('filter.children')}</option>
            <option value="PG-13">{t('filter.youth')}</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Person search */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('filter.personSearch')}</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" value={personQuery} onChange={e => setPersonQuery(e.target.value)} placeholder={t('filter.personPlaceholder')}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-9 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500" />
          {(personQuery || filters.personId) && (
            <button onClick={clearPerson} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
          )}
        </div>
        {personResults.length > 0 && (
          <div className="mt-1 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-xl">
            {personResults.map(p => (
              <button key={p.id} onClick={() => selectPerson(p.id, p.name, p.dept)}
                className="w-full text-left px-3 py-2 hover:bg-gray-700 text-sm text-white flex justify-between items-center">
                <span>{p.name}</span><span className="text-xs text-gray-500">{p.dept}</span>
              </button>
            ))}
          </div>
        )}
        {personSearchLoading && <p className="text-xs text-gray-500 mt-1">{t('filter.searching')}</p>}
        {filters.personId && <p className="text-xs text-green-400 mt-1">{t('filter.filteredBy', { name: filters.personName })}</p>}
      </div>

      {/* Min rating */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          {t('filter.minRating', { value: filters.minRating > 0 ? filters.minRating.toFixed(1) : t('filter.minRatingAll') })}
        </label>
        <input type="range" min={0} max={9} step={0.5} value={filters.minRating}
          onChange={e => onChange({ ...filters, minRating: parseFloat(e.target.value) })}
          className="w-full accent-red-500" />
        <div className="flex justify-between text-xs text-gray-500 mt-1"><span>{t('filter.ratingAll')}</span><span>9.0</span></div>
      </div>

      {/* Origin country */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('filter.originCountry')}</label>
        <div className="relative">
          <select value={filters.originCountry} onChange={e => onChange({ ...filters, originCountry: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-red-500 pr-8">
            {COUNTRY_CODES.map(code => (
              <option key={code} value={code}>{code === '' ? t('filter.allCountries') : countryDisplayNames.of(code) ?? code}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Year range */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          {t('filter.yearRange', { from: filters.yearFrom, to: filters.yearTo })}
        </label>
        <div className="relative mt-3 mb-1">
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-gray-700 rounded-full pointer-events-none">
            <div className="absolute h-full bg-red-500 rounded-full"
              style={{ left: `${((filters.yearFrom - 1950) / (CURRENT_YEAR - 1950)) * 100}%`, right: `${((CURRENT_YEAR - filters.yearTo) / (CURRENT_YEAR - 1950)) * 100}%` }} />
          </div>
          <div className="dual-range">
            <input type="range" min={1950} max={CURRENT_YEAR} step={1} value={filters.yearFrom}
              onChange={e => { const v = parseInt(e.target.value); onChange({ ...filters, yearFrom: v, yearTo: Math.max(v, filters.yearTo) }); }} />
            <input type="range" min={1950} max={CURRENT_YEAR} step={1} value={filters.yearTo}
              onChange={e => { const v = parseInt(e.target.value); onChange({ ...filters, yearTo: v, yearFrom: Math.min(v, filters.yearFrom) }); }} />
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1"><span>1950</span><span>{CURRENT_YEAR}</span></div>
      </div>

      {/* Genres */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('filter.genre')}</label>
        <div className="flex flex-wrap gap-2">
          {genres.map(genre => {
            const active = filters.genres.includes(genre.id);
            return (
              <button key={genre.id} onClick={() => toggleGenre(genre.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${active ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
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
      {/* Mobile full-screen panel */}
      {mobileOpen && <div className="lg:hidden">{mobilePanel}</div>}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-4 bg-gray-900 border border-gray-800 rounded-xl p-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
          <h2 className="font-semibold text-white flex items-center gap-2 mb-4">
            <SlidersHorizontal className="w-4 h-4" />
            {t('filter.title')}
            {activeFilterCount > 0 && (
              <span className="bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">{activeFilterCount}</span>
            )}
          </h2>
          {desktopPanel}
        </div>
      </aside>
    </>
  );
}
