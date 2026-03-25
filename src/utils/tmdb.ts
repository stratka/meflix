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

  const isTV = filters.mediaType === 'tv';
  const dateGteParam = isTV ? 'first_air_date.gte' : 'primary_release_date.gte';
  const dateLteParam = isTV ? 'first_air_date.lte' : 'primary_release_date.lte';

  const params = new URLSearchParams({
    watch_region: region,
    with_watch_providers: filterServiceIds.join('|'),
    with_watch_monetization_types: 'flatrate',
    sort_by: filters.sortBy,
    'vote_count.gte': '0',
    page: String(page),
    language: 'cs-CZ',
  });

  if (filters.genres.length > 0) params.set('with_genres', filters.genres.join(','));
  if (filters.minRating > 0) params.set('vote_average.gte', String(filters.minRating));
  if (filters.yearFrom) params.set(dateGteParam, `${filters.yearFrom}-01-01`);
  if (filters.yearTo) params.set(dateLteParam, `${filters.yearTo}-12-31`);
  if (filters.personId) {
    if (filters.personRole === 'cast') params.set('with_cast', String(filters.personId));
    else params.set('with_crew', String(filters.personId));
  }
  if (filters.originCountry) params.set('with_origin_country', filters.originCountry);

  const endpoint = isTV ? 'discover/tv' : 'discover/movie';
  const raw = await tmdbFetch<TMDBDiscoverResponse>(buildUrl(endpoint, params));

  if (isTV) {
    raw.results = raw.results.map((item: any) => ({
      ...item,
      title: item.name || item.original_name || '',
      release_date: item.first_air_date || '',
      media_type: 'tv' as const,
    }));
  } else {
    raw.results = raw.results.map(item => ({ ...item, media_type: 'movie' as const }));
  }

  return raw;
}

export async function fetchMovieDetail(
  movieId: number,
  _region: string,
  mediaType: 'movie' | 'tv' = 'movie'
): Promise<TMDBMovieDetail> {
  const params = new URLSearchParams({
    language: 'cs-CZ',
    append_to_response: 'credits,watch/providers,videos',
  });
  const endpoint = mediaType === 'tv' ? `tv/${movieId}` : `movie/${movieId}`;
  const data = await tmdbFetch<any>(buildUrl(endpoint, params));
  if (data['watch/providers']) data.watch_providers = data['watch/providers'];
  if (mediaType === 'tv') {
    data.title = data.name || data.original_name || '';
    data.release_date = data.first_air_date || '';
    data.media_type = 'tv';
  } else {
    data.media_type = 'movie';
  }
  return data as TMDBMovieDetail;
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
