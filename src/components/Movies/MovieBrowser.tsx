import { useState, useEffect, useRef, useCallback } from 'react';
import { AlertCircle, RefreshCw, Search, X, ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { User } from '@supabase/supabase-js';
import type { TMDBMovie } from '../../types/tmdb';
import type { AppSettings, FilterState, WatchedMovies } from '../../types/app';
import { useMovies } from '../../hooks/useMovies';
import { useGenres } from '../../hooks/useGenres';
import { useCloudWatchlist } from '../../hooks/useCloudWatchlist';
import { fetchMovieDetail } from '../../utils/tmdb';
import { MovieCard } from './MovieCard';
import { MovieModal } from './MovieModal';
import { MovieSkeletonGrid } from './MovieSkeleton';
import { FilterPanel } from '../Filters/FilterPanel';
import { EmptyState } from '../common/EmptyState';
import { STREAMING_SERVICES } from '../../utils/constants';

interface Props {
  settings: AppSettings;
  user: User | null;
  resetKey?: number;
  watched: WatchedMovies;
  markWatched: (id: number, title: string) => void;
  unmarkWatched: (id: number) => void;
  isWatched: (id: number) => boolean;
  onOpenSettings?: () => void;
}

const CURRENT_YEAR = new Date().getFullYear();

const FILTERS_KEY = 'meflix_filters';

const DEFAULT_FILTERS: FilterState = {
  genres: [],
  minRating: 0,
  yearFrom: 1950,
  yearTo: CURRENT_YEAR,
  services: [],
  personId: null,
  personName: '',
  personRole: 'cast',
  sortBy: 'popularity.desc',
  watchedFilter: 'all' as const,
  watchlistFilter: 'all' as const,
  originCountry: '',
  mediaType: 'movie',
  certification: '' as const,
  signLanguage: false,
};

function loadFilters(): FilterState {
  try {
    const saved = JSON.parse(localStorage.getItem(FILTERS_KEY) || '{}');
    return { ...DEFAULT_FILTERS, ...saved };
  } catch { return DEFAULT_FILTERS; }
}

function saveFilters(f: FilterState) {
  localStorage.setItem(FILTERS_KEY, JSON.stringify(f));
}

export function MovieBrowser({ settings, user, resetKey, watched, markWatched, unmarkWatched, isWatched, onOpenSettings }: Props) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<FilterState>(loadFilters);

  useEffect(() => { saveFilters(filters); }, [filters]);
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const { watchlist, isInWatchlist, addToWatchlist, removeFromWatchlist } = useCloudWatchlist(user);
  const [idMovies, setIdMovies] = useState<TMDBMovie[]>([]);
  const [idLoading, setIdLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hiddenMovieIds, setHiddenMovieIds] = useState<Set<number>>(new Set());
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Android back button: otevření filtru pushne history, back ho zavře
  const mobileFilterOpenRef = useRef(mobileFilterOpen);
  useEffect(() => { mobileFilterOpenRef.current = mobileFilterOpen; }, [mobileFilterOpen]);
  useEffect(() => {
    if (!mobileFilterOpen) return;
    window.scrollTo({ top: 0, behavior: 'instant' });
    history.pushState({ mobileFilter: true }, '');
    const handlePopState = () => { if (mobileFilterOpenRef.current) setMobileFilterOpen(false); };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (history.state?.mobileFilter) history.back();
    };
  }, [mobileFilterOpen]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => { if (document.activeElement === searchRef.current) searchRef.current?.blur(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (resetKey === 0 || resetKey === undefined) return;
    setSearchInput('');
    setSearchQuery('');
    setMobileFilterOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [resetKey]);

  const idMode = filters.watchlistFilter === 'only' || filters.watchedFilter === 'only';
  useEffect(() => {
    if (!idMode) { setIdMovies([]); return; }
    const ids = filters.watchlistFilter === 'only'
      ? [...watchlist]
      : Object.keys(watched).map(Number);
    if (ids.length === 0) { setIdMovies([]); return; }
    setIdLoading(true);
    Promise.all(ids.map(id => fetchMovieDetail(id, settings.region, filters.mediaType).catch(() => null)))
      .then(results => setIdMovies(results.filter(Boolean) as TMDBMovie[]))
      .finally(() => setIdLoading(false));
  }, [idMode, filters.watchlistFilter, filters.watchedFilter, filters.mediaType, watchlist, watched, settings.region]);

  const { movies, unavailableIds, movieProviders, loading, loadingMore, error, hasMore, totalResults, loadMore } = useMovies(
    settings.region,
    settings.selectedServices,
    filters,
    searchQuery
  );

  const { genres } = useGenres(filters.mediaType);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
        loadMore();
      }
    },
    [hasMore, loadingMore, loading, loadMore]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1, rootMargin: '400px' });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  const userServicesList = STREAMING_SERVICES.filter(s =>
    settings.selectedServices.includes(s.id)
  );

  const isSearching = searchQuery.trim().length > 0;

  const displayedCount = idMode
    ? idMovies
        .filter(m => !hiddenMovieIds.has(m.id))
        .filter(m => filters.watchedFilter !== 'hide' || !isWatched(m.id))
        .filter(m => filters.watchlistFilter !== 'hide' || !isInWatchlist(m.id))
        .filter(m => {
              const isASL = m.original_language === 'sgn' || /\bASL\b/i.test(m.title ?? '');
              return filters.signLanguage ? isASL : !isASL;
            })
        .length
    : totalResults;

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

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gray-900/50 border-b border-gray-800 px-4 py-3 sticky top-16 z-20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder={t('browser.searchPlaceholder')}
              className="w-full bg-gray-800 text-white placeholder-gray-500 text-sm rounded-lg pl-9 pr-8 py-2 border border-gray-700 focus:outline-none focus:border-gray-500 transition-colors"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(''); setSearchQuery(''); searchRef.current?.focus(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile filter toggle + reset */}
          {!isSearching && (
            <div className="lg:hidden flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setMobileFilterOpen(o => !o)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg text-sm text-white"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {t('browser.filters')}
                {activeFilterCount > 0 && (
                  <span className="bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                >
                  {t('browser.reset')}
                </button>
              )}
            </div>
          )}

          {/* Service badges */}
          {!isSearching && (
            <div className="flex items-center gap-2 flex-wrap">
              {userServicesList.map(s => {
                const active = filters.services.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      const next = active
                        ? filters.services.filter(id => id !== s.id)
                        : [...filters.services, s.id];
                      setFilters({ ...filters, services: next });
                    }}
                    className="transition-all hover:scale-105 active:scale-95"
                    title={active ? t('browser.filterRemove', { name: s.name }) : t('browser.filterOnly', { name: s.name })}
                  >
                    <span
                      className="inline-block rounded-full font-semibold text-xs px-2 py-0.5 transition-colors"
                      style={
                        filters.services.length === 0 || active
                          ? { backgroundColor: s.color, color: s.textColor }
                          : { backgroundColor: '#374151', color: '#9ca3af' }
                      }
                    >
                      {s.name}
                    </span>
                  </button>
                );
              })}
              {filters.services.length > 0 && (
                <button
                  onClick={() => setFilters({ ...filters, services: [] })}
                  className="text-xs text-gray-500 hover:text-white px-2 py-1 rounded transition-colors"
                >
                  {t('browser.clearAll')}
                </button>
              )}
            </div>
          )}

          {/* Reset filtry — desktop */}
          {!isSearching && activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="hidden lg:block px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
            >
              {t('browser.resetFilters', { count: activeFilterCount })}
            </button>
          )}

          {/* Počet výsledků */}
          {(idMode ? idMovies.length > 0 : totalResults > 0) && (
            <span className="text-sm text-gray-500 ml-auto">
              {isSearching
                ? t('browser.results', { count: totalResults })
                : t('browser.movies', { count: idMode ? idMovies.length : totalResults })}
            </span>
          )}
        </div>
      </div>

      {/* Layout */}
      <div className="max-w-7xl mx-auto lg:flex lg:gap-6 lg:p-6 p-0">
        {!isSearching && (
          <FilterPanel
            filters={filters}
            genres={genres}
            onChange={setFilters}
            mobileOpen={mobileFilterOpen}
            onMobileOpenChange={setMobileFilterOpen}
            totalResults={displayedCount}
          />
        )}

        {/* Movie grid */}
        <div className="flex-1 min-w-0 px-4 lg:px-0 pt-4 lg:pt-0">
          {settings.selectedServices.length === 0 && (
            <div className="flex items-center gap-3 p-4 bg-yellow-900/30 border border-yellow-800/50 rounded-xl text-yellow-300 mb-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm flex-1">{t('browser.noServices')}</span>
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="text-xs font-semibold text-yellow-200 hover:text-white underline underline-offset-2 shrink-0 transition-colors"
                >
                  {t('browser.addServices')}
                </button>
              )}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-900/30 border border-red-800/50 rounded-xl text-red-300 mb-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm flex-1">{error}</span>
              <button onClick={() => setFilters({ ...filters })} className="flex items-center gap-1 text-xs hover:text-white">
                <RefreshCw className="w-3 h-3" /> {t('browser.tryAgain')}
              </button>
            </div>
          )}

          {(idMode ? idLoading : loading) ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              <MovieSkeletonGrid count={20} />
            </div>
          ) : (idMode ? idMovies : movies).filter(m => !hiddenMovieIds.has(m.id)).filter(m => {
              if (!idMode) return filters.watchedFilter === 'all' || (filters.watchedFilter === 'hide' ? !isWatched(m.id) : isWatched(m.id));
              return filters.watchedFilter !== 'hide' || !isWatched(m.id);
            }).filter(m => {
              if (!idMode) return filters.watchlistFilter === 'all' || (filters.watchlistFilter === 'hide' ? !isInWatchlist(m.id) : isInWatchlist(m.id));
              return filters.watchlistFilter !== 'hide' || !isInWatchlist(m.id);
            }).filter(m => {
              const isASL = m.original_language === 'sgn' || /\bASL\b/i.test(m.title ?? '');
              return filters.signLanguage ? isASL : !isASL;
            })
            .sort((a, b) => {
              if (filters.watchedFilter !== 'only') return 0;
              const dateA = watched[a.id]?.date ?? '';
              const dateB = watched[b.id]?.date ?? '';
              return dateB.localeCompare(dateA);
            }).length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                {(idMode ? idMovies : movies)
                  .filter(m => !hiddenMovieIds.has(m.id))
                  .filter(m => { if (!idMode) return filters.watchedFilter === 'all' || (filters.watchedFilter === 'hide' ? !isWatched(m.id) : isWatched(m.id)); return filters.watchedFilter !== 'hide' || !isWatched(m.id); })
                  .filter(m => { if (!idMode) return filters.watchlistFilter === 'all' || (filters.watchlistFilter === 'hide' ? !isInWatchlist(m.id) : isInWatchlist(m.id)); return filters.watchlistFilter !== 'hide' || !isInWatchlist(m.id); })
                  .filter(m => {
              const isASL = m.original_language === 'sgn' || /\bASL\b/i.test(m.title ?? '');
              return filters.signLanguage ? isASL : !isASL;
            })
                  .sort((a, b) => {
                    if (filters.watchedFilter !== 'only') return 0;
                    const dateA = watched[a.id]?.date ?? '';
                    const dateB = watched[b.id]?.date ?? '';
                    return dateB.localeCompare(dateA);
                  })
                  .map(movie => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onClick={setSelectedMovie}
                    isWatched={isWatched(movie.id)}
                    watchedDate={watched[movie.id]?.date}
                    dimmed={unavailableIds.has(movie.id)}
                    availableOn={unavailableIds.has(movie.id) ? movieProviders.get(movie.id) : undefined}
                  />
                ))}
                {!idMode && loadingMore && <MovieSkeletonGrid count={10} />}
              </div>

              {!idMode && <div ref={loaderRef} className="h-8 mt-4" />}

              {!idMode && !hasMore && movies.length > 0 && (
                <p className="text-center text-sm text-gray-600 pb-8">
                  {t('browser.allShown', { count: movies.length })}
                </p>
              )}
              {idMode && (
                <p className="text-center text-sm text-gray-600 pb-8">
                  {t('browser.total', { count: idMovies.length })}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Back to browse button */}
      {isSearching && (
        <button
          onClick={() => { setSearchInput(''); setSearchQuery(''); }}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
          aria-label={t('modal.back')}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      {/* Modal */}
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          settings={settings}
          onClose={() => setSelectedMovie(null)}
          onNotAvailable={(id) => setHiddenMovieIds(prev => new Set(prev).add(id))}
          watchedEntry={watched[selectedMovie.id]}
          onMarkWatched={markWatched}
          onUnmarkWatched={unmarkWatched}
          isInWatchlist={isInWatchlist(selectedMovie.id)}
          onToggleWatchlist={(id) => isInWatchlist(id) ? removeFromWatchlist(id) : addToWatchlist(id, selectedMovie!.title)}
          onPersonClick={(personId, personName, role) => {
            setFilters(f => ({ ...f, personId, personName, personRole: role }));
            setSelectedMovie(null);
          }}
          onMovieClick={setSelectedMovie}
        />
      )}
    </div>
  );
}
