import type {
  TMDBDiscoverResponse,
  TMDBMovieDetail,
  TMDBGenresResponse,
  TMDBSearchPersonResponse,
  WatchProviderResponse,
} from '../types/tmdb';
import type { FilterState } from '../types/app';
import { STREAMING_SERVICES, getAllTmdbIds, getTmdbIdFromServiceId } from './constants';
import i18n from '../i18n';

const CURRENT_YEAR = new Date().getFullYear();

const TMDB_LANG_MAP: Record<string, string> = {
  zh: 'zh-CN',
  no: 'nb-NO',
};

function getTmdbLanguage(): string {
  const lang = i18n.language?.split('-')[0] || 'en';
  return TMDB_LANG_MAP[lang] ?? lang;
}

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
  return tmdbFetch<TMDBGenresResponse>(buildUrl('genre/movie/list', new URLSearchParams({ language: getTmdbLanguage() })));
}

/** Vrátí seznam providerů dostupných v daném regionu (ID + název + logo) */
export async function fetchRegionProviders(region: string): Promise<{ id: number; name: string; logoPath: string | null }[]> {
  const params = new URLSearchParams({ watch_region: region });
  const data = await tmdbFetch<{ results: { provider_id: number; provider_name: string; logo_path?: string; display_priority: number }[] }>(
    buildUrl('watch/providers/movie', params)
  );
  return data.results
    .sort((a, b) => a.display_priority - b.display_priority)
    .map(p => ({ id: p.provider_id, name: p.provider_name, logoPath: p.logo_path ?? null }));
}

export async function discoverMovies(
  region: string,
  selectedServices: string[],
  filters: FilterState,
  page: number = 1
): Promise<TMDBDiscoverResponse> {
  function resolveIds(ids: string[]): number[] {
    return ids.flatMap(id => {
      const svc = STREAMING_SERVICES.find(s => s.id === id);
      if (svc) return getAllTmdbIds(svc);
      const tmdbId = getTmdbIdFromServiceId(id);
      return tmdbId ? [tmdbId] : [];
    });
  }

  const serviceIds = resolveIds(selectedServices);
  const filterServiceIds = filters.services.length > 0 ? resolveIds(filters.services) : serviceIds;

  const isTV = filters.mediaType === 'tv';
  const dateGteParam = isTV ? 'first_air_date.gte' : 'primary_release_date.gte';
  const dateLteParam = isTV ? 'first_air_date.lte' : 'primary_release_date.lte';

  const params = new URLSearchParams({
    sort_by: filters.sortBy,
    'vote_count.gte': '5',
    page: String(page),
    language: getTmdbLanguage(),
  });

  if (filterServiceIds.length > 0) {
    params.set('watch_region', region);
    params.set('with_watch_providers', filterServiceIds.join('|'));
    params.set('with_watch_monetization_types', 'flatrate');
  }

  if (filters.genres.length > 0) params.set('with_genres', filters.genres.join(','));
  if (filters.minRating > 0) params.set('vote_average.gte', String(filters.minRating));
  if (filters.yearFrom > 1900) params.set(dateGteParam, `${filters.yearFrom}-01-01`);
  if (filters.yearTo < CURRENT_YEAR) params.set(dateLteParam, `${filters.yearTo}-12-31`);
  if (filters.personId) {
    if (filters.personRole === 'cast') params.set('with_cast', String(filters.personId));
    else params.set('with_crew', String(filters.personId));
  }
  if (filters.originCountry) params.set('with_origin_country', filters.originCountry);
  if (filters.certification) {
    params.set('certification_country', 'US');
    params.set('certification.gte', 'G');
    params.set('certification.lte', filters.certification);
  }

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
    language: getTmdbLanguage(),
    append_to_response: 'credits,watch/providers,videos',
    include_video_language: `${i18n.language?.split('-')[0] || 'en'},en`,
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
  const params = new URLSearchParams({ query, language: getTmdbLanguage(), page: String(page) });
  const raw = await tmdbFetch<any>(buildUrl('search/multi', params));
  // Filtruj jen filmy a seriály, mapuj TV pole na movie pole
  raw.results = (raw.results || [])
    .filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv')
    .map((r: any) => {
      if (r.media_type === 'tv') {
        return { ...r, title: r.name || r.original_name || '', release_date: r.first_air_date || '' };
      }
      return r;
    });
  return raw as TMDBDiscoverResponse;
}

export async function fetchMovieWatchProviders(
  movieId: number,
  mediaType: 'movie' | 'tv' = 'movie'
): Promise<WatchProviderResponse> {
  const endpoint = mediaType === 'tv' ? `tv/${movieId}/watch/providers` : `movie/${movieId}/watch/providers`;
  return tmdbFetch<WatchProviderResponse>(buildUrl(endpoint));
}

export async function searchPerson(query: string): Promise<TMDBSearchPersonResponse> {
  const params = new URLSearchParams({ query, language: getTmdbLanguage() });
  return tmdbFetch<TMDBSearchPersonResponse>(buildUrl('search/person', params));
}

export async function fetchSimilarMovies(
  movieId: number,
  mediaType: 'movie' | 'tv' = 'movie'
): Promise<TMDBDiscoverResponse> {
  const params = new URLSearchParams({ language: getTmdbLanguage() });
  const endpoint = mediaType === 'tv' ? `tv/${movieId}/similar` : `movie/${movieId}/similar`;
  const raw = await tmdbFetch<any>(buildUrl(endpoint, params));
  if (mediaType === 'tv') {
    raw.results = (raw.results || []).map((item: any) => ({
      ...item,
      title: item.name || item.original_name || '',
      release_date: item.first_air_date || '',
      media_type: 'tv' as const,
    }));
  } else {
    raw.results = (raw.results || []).map((item: any) => ({ ...item, media_type: 'movie' as const }));
  }
  return raw as TMDBDiscoverResponse;
}
