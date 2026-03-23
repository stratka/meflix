import type {
  TMDBDiscoverResponse,
  TMDBMovieDetail,
  TMDBGenresResponse,
  TMDBSearchPersonResponse,
  WatchProviderResponse,
} from '../types/tmdb';
import type { FilterState } from '../types/app';
import { STREAMING_SERVICES, getAllTmdbIds } from './constants';

// Builds /api/tmdb?_path=<tmdbPath>&<otherParams>
function buildUrl(tmdbPath: string, params?: URLSearchParams): string {
  const p = new URLSearchParams(params);
  p.set('_path', tmdbPath);
  return `/api/tmdb?${p}`;
}

async function tmdbFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { status_message?: string }).status_message || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchGenres(): Promise<TMDBGenresResponse> {
  return tmdbFetch<TMDBGenresResponse>(buildUrl('genre/movie/list', new URLSearchParams({ language: 'cs-CZ' })));
}

export async function discoverMovies(
  region: string,
  selectedServices: string[],
  filters: FilterState,
  page: number = 1
): Promise<TMDBDiscoverResponse> {
  const serviceIds = selectedServices.flatMap(id => {
    const svc = STREAMING_SERVICES.find(s => s.id === id);
    return svc ? getAllTmdbIds(svc) : [];
  });

  const filterServiceIds =
    filters.services.length > 0
      ? filters.services.flatMap(id => {
          const svc = STREAMING_SERVICES.find(s => s.id === id);
          return svc ? getAllTmdbIds(svc) : [];
        })
      : serviceIds;

  if (filterServiceIds.length === 0) {
    return { page: 1, results: [], total_pages: 0, total_results: 0 };
  }

  const params = new URLSearchParams({
    watch_region: region,
    with_watch_providers: filterServiceIds.join('|'),
    with_watch_monetization_types: 'flatrate',
    sort_by: filters.sortBy,
    'vote_count.gte': '50',
    page: String(page),
    language: 'cs-CZ',
  });

  if (filters.genres.length > 0) params.set('with_genres', filters.genres.join(','));
  if (filters.minRating > 0) params.set('vote_average.gte', String(filters.minRating));
  if (filters.yearFrom) params.set('primary_release_date.gte', `${filters.yearFrom}-01-01`);
  if (filters.yearTo) params.set('primary_release_date.lte', `${filters.yearTo}-12-31`);
  if (filters.personId) {
    if (filters.personRole === 'cast') params.set('with_cast', String(filters.personId));
    else params.set('with_crew', String(filters.personId));
  }

  return tmdbFetch<TMDBDiscoverResponse>(buildUrl('discover/movie', params));
}

export async function fetchMovieDetail(
  movieId: number,
  _region: string
): Promise<TMDBMovieDetail> {
  const params = new URLSearchParams({
    language: 'cs-CZ',
    append_to_response: 'credits,watch/providers,videos',
  });
  const data = await tmdbFetch<TMDBMovieDetail & { 'watch/providers': WatchProviderResponse }>(
    buildUrl(`movie/${movieId}`, params)
  );
  if (data['watch/providers']) {
    data.watch_providers = data['watch/providers'];
  }
  return data;
}

export async function searchMovies(
  query: string,
  page: number = 1
): Promise<TMDBDiscoverResponse> {
  const params = new URLSearchParams({ query, language: 'cs-CZ', page: String(page) });
  return tmdbFetch<TMDBDiscoverResponse>(buildUrl('search/movie', params));
}

export async function fetchMovieWatchProviders(
  movieId: number
): Promise<WatchProviderResponse> {
  return tmdbFetch<WatchProviderResponse>(buildUrl(`movie/${movieId}/watch/providers`));
}

export async function searchPerson(query: string): Promise<TMDBSearchPersonResponse> {
  const params = new URLSearchParams({ query, language: 'cs-CZ' });
  return tmdbFetch<TMDBSearchPersonResponse>(buildUrl('search/person', params));
}
