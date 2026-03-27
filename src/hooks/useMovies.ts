import { useState, useEffect, useCallback, useRef } from 'react';
import type { TMDBMovie } from '../types/tmdb';
import type { FilterState, StreamingService } from '../types/app';
import { discoverMovies, searchMovies, fetchMovieWatchProviders } from '../utils/tmdb';
import { STREAMING_SERVICES, getAllTmdbIds, getServiceByTmdbId } from '../utils/constants';


interface UseMoviesResult {
  movies: TMDBMovie[];
  unavailableIds: Set<number>;
  movieProviders: Map<number, StreamingService[]>;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  totalResults: number;
  loadMore: () => void;
  reset: () => void;
}

function getUserProviderIds(selectedServices: string[]): number[] {
  return selectedServices.flatMap(id => {
    const svc = STREAMING_SERVICES.find(s => s.id === id);
    return svc ? getAllTmdbIds(svc) : [];
  });
}

async function checkAvailability(
  movies: TMDBMovie[],
  region: string,
  providerIds: number[]
): Promise<{ all: TMDBMovie[]; unavailableIds: Set<number>; movieProviders: Map<number, StreamingService[]> }> {
  const results = await Promise.allSettled(
    movies.map(async movie => {
      const mediaType = movie.media_type === 'tv' ? 'tv' : 'movie';
      const providers = await fetchMovieWatchProviders(movie.id, mediaType);
      const flatrate = providers.results?.[region]?.flatrate ?? [];
      const available = flatrate.some(p => providerIds.includes(p.provider_id));
      const services = flatrate
        .map(p => getServiceByTmdbId(p.provider_id))
        .filter((s): s is StreamingService => s !== undefined);
      return { movie, available, services };
    })
  );
  const unavailableIds = new Set<number>();
  const movieProviders = new Map<number, StreamingService[]>();
  const all: TMDBMovie[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      all.push(r.value.movie);
      if (!r.value.available) unavailableIds.add(r.value.movie.id);
      if (r.value.services.length > 0) movieProviders.set(r.value.movie.id, r.value.services);
    }
  }
  return { all, unavailableIds, movieProviders };
}

export function useMovies(
  region: string,
  selectedServices: string[],
  filters: FilterState,
  searchQuery: string = ''
): UseMoviesResult {
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [unavailableIds, setUnavailableIds] = useState<Set<number>>(new Set());
  const [movieProviders, setMovieProviders] = useState<Map<number, StreamingService[]>>(new Map());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchPage = useCallback(
    async (pageNum: number, replace: boolean) => {
      const isSearch = searchQuery.trim().length > 0;

      if (!isSearch && selectedServices.length === 0) {
        setMovies([]);
        setTotalResults(0);
        setLoading(false);
        return;
      }

      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      if (replace) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        if (isSearch) {
          const data = await searchMovies(searchQuery.trim(), pageNum);
          const providerIds = getUserProviderIds(selectedServices);
          const { all, unavailableIds: newUnavailable, movieProviders: newProviders } = await checkAvailability(data.results, region, providerIds);
          setMovies(prev => (replace ? all : [...prev, ...all]));
          setUnavailableIds(prev => {
            if (replace) return newUnavailable;
            const merged = new Set(prev);
            newUnavailable.forEach(id => merged.add(id));
            return merged;
          });
          setMovieProviders(prev => {
            if (replace) return newProviders;
            const merged = new Map(prev);
            newProviders.forEach((v, k) => merged.set(k, v));
            return merged;
          });
          setTotalPages(data.total_pages);
          setTotalResults(data.total_results);
          setPage(pageNum);
        } else {
          const data = await discoverMovies(region, selectedServices, filters, pageNum);
          setMovies(prev => (replace ? data.results : [...prev, ...data.results]));
          setTotalPages(data.total_pages);
          setTotalResults(data.total_results);
          setPage(pageNum);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message || 'Chyba při načítání filmů');
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [region, selectedServices, filters, searchQuery]
  );

  useEffect(() => {
    fetchPage(1, true);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!loadingMore && page < totalPages) {
      fetchPage(page + 1, false);
    }
  }, [loadingMore, page, totalPages, fetchPage]);

  const reset = useCallback(() => {
    setMovies([]);
    setPage(1);
    fetchPage(1, true);
  }, [fetchPage]);

  return { movies, unavailableIds, movieProviders, loading, loadingMore, error, hasMore: page < totalPages, totalResults, loadMore, reset };
}
