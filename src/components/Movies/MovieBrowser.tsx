import { useState, useEffect, useRef, useCallback } from 'react';
import { AlertCircle, RefreshCw, Search, X } from 'lucide-react';
import type { TMDBMovie } from '../../types/tmdb';
import type { AppSettings, FilterState } from '../../types/app';
import { useMovies } from '../../hooks/useMovies';
import { useGenres } from '../../hooks/useGenres';
import { MovieCard } from './MovieCard';
import { MovieModal } from './MovieModal';
import { MovieSkeletonGrid } from './MovieSkeleton';
import { FilterPanel } from '../Filters/FilterPanel';
import { EmptyState } from '../common/EmptyState';
import { STREAMING_SERVICES } from '../../utils/constants';
import { ServiceBadge } from '../common/ServiceBadge';

interface Props {
  settings: AppSettings;
}

const CURRENT_YEAR = new Date().getFullYear();

const DEFAULT_FILTERS: FilterState = {
  genres: [],
  minRating: 0,
  yearFrom: 1900,
  yearTo: CURRENT_YEAR,
  services: [],
  personId: null,
  personName: '',
  personRole: 'cast',
  sortBy: 'vote_average.desc',
};

export function MovieBrowser({ settings }: Props) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hiddenMovieIds, setHiddenMovieIds] = useState<Set<number>>(new Set());
  const loaderRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const { movies, loading, loadingMore, error, hasMore, totalResults, loadMore } = useMovies(
    settings.region,
    settings.selectedServices,
    filters,
    searchQuery
  );

  const { genres } = useGenres();

  // Debounce search — čekej 400ms po posledním stisku klávesy
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        loadMore();
      }
    },
    [hasMore, loadingMore, loadMore]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  const userServicesList = STREAMING_SERVICES.filter(s =>
    settings.selectedServices.includes(s.id)
  );

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gray-900/50 border-b border-gray-800 px-4 py-3 sticky top-0 z-20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-4 flex-wrap">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Hledat film…"
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

          {/* Service badges — kliknutím filtruješ */}
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
                    title={active ? `Zrušit filtr ${s.name}` : `Filtrovat jen ${s.name}`}
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
                  × vše
                </button>
              )}
            </div>
          )}

          {/* Počet výsledků */}
          {!loading && totalResults > 0 && (
            <span className="text-sm text-gray-500 ml-auto">
              {isSearching ? `${totalResults.toLocaleString()} výsledků` : `${totalResults.toLocaleString()} filmů`}
            </span>
          )}
        </div>
      </div>

      {/* Layout */}
      <div className="max-w-7xl mx-auto lg:flex lg:gap-6 lg:p-6 p-0">
        {/* Filters — skryj při hledání */}
        {!isSearching && (
          <FilterPanel
            filters={filters}
            genres={genres}
            selectedServices={settings.selectedServices}
            onChange={setFilters}
          />
        )}

        {/* Movie grid */}
        <div className="flex-1 min-w-0 px-4 lg:px-0 pt-4 lg:pt-0">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-900/30 border border-red-800/50 rounded-xl text-red-300 mb-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm flex-1">{error}</span>
              <button onClick={() => setFilters({ ...filters })} className="flex items-center gap-1 text-xs hover:text-white">
                <RefreshCw className="w-3 h-3" /> Zkusit znovu
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              <MovieSkeletonGrid count={20} />
            </div>
          ) : movies.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                {movies.filter(m => !hiddenMovieIds.has(m.id)).map(movie => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onClick={setSelectedMovie}
                  />
                ))}
                {loadingMore && <MovieSkeletonGrid count={10} />}
              </div>

              {/* Infinite scroll trigger */}
              <div ref={loaderRef} className="h-8 mt-4" />

              {!hasMore && movies.length > 0 && (
                <p className="text-center text-sm text-gray-600 pb-8">
                  Zobrazeno všech {movies.length} filmů
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          settings={settings}
          onClose={() => setSelectedMovie(null)}
          onNotAvailable={(id) => setHiddenMovieIds(prev => new Set(prev).add(id))}
        />
      )}
    </div>
  );
}
