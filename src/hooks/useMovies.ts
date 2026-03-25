import { useState, useEffect, useCallback, useRef } from 'react';
import type { TMDBMovie } from '../types/tmdb';
import type { FilterState } from '../types/app';
import { discoverMovies, searchMovies, fetchMovieWatchProviders } from '../utils/tmdb';
import { STREAMING_SERVICES, getAllTmdbIds } from '../utils/constants';

export function cappedRating(r: number): number {
  return r >= 10 ? 5 : r;
}

function sortByCappedRating(movies: TMDBMovie[]): TMDBMovie[] {
  return [...movies].sort((a, b) => cappedRating(b.vote_average) - cappedRating(a.vote_average));
}

interface UseMoviesResult {
  movies: TMDBMovie[];
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

async function filterByAvailability(
  movies: TMDBMovie[],
  region: string,
  providerIds: number[]
): Promise<TMDBMovie[]> {
  const results = await Promise.allSettled(
    movies.map(async movie => {
      const mediaType = movie.media_type === 'tv' ? 'tv' : 'movie';
      const providers = await fetchMovieWatchProviders(movie.id, mediaType);
      const flatrate = providers.results?.[region]?.flatrate ?? [];
      const available = flatrate.some(p => providerIds.includes(p.provider_id));
      return available ? movie : null;
    })
  );
  return results
    .filter((r): r is PromiseFulfilledResult<TMDBMovie | null> => r.status === 'fulfilled')
    .map(r => r.value)
    .filter((m): m is TMDBMovie => m !== null);
}

export function useMovies(
  region: string,
  selectedServices: string[],
  filters: FilterState,
  searchQuery: string = ''
): UseMoviesResult {
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
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
          const filtered = await filterByAvailability(data.results, region, providerIds);
          setMovies(prev => (replace ? filtered : [...prev, ...filtered]));
          setTotalPages(data.total_pages);
          setTotalResults(data.total_results);
          setPage(pageNum);
        } else {
          const data = await discoverMovies(region, selectedServices, filters, pageNum);
          const results = filters.sortBy === 'vote_average.desc'
            ? sortByCappedRating(data.results)
            : data.results;
          setMovies(prev => (replace ? results : [...prev, ...results]));
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

  return { movies, loading, loadingMore, error, hasMore: page < totalPages, totalResults, loadMore, reset };
}
