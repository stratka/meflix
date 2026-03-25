import type { StreamingService } from '../types/app';

export const STREAMING_SERVICES: StreamingService[] = [
  { id: 'netflix',    name: 'Netflix',      tmdbId: 8,    color: '#E50914', textColor: '#fff' },
  { id: 'disney',     name: 'Disney+',      tmdbId: 337,  color: '#006E99', textColor: '#fff' },
  { id: 'max',        name: 'Max',          tmdbId: 1899, tmdbIds: [1899, 29, 384], color: '#002BE7', textColor: '#fff' },
  { id: 'prime',      name: 'Prime Video',  tmdbId: 9,    tmdbIds: [9, 119, 10],   color: '#00A8E1', textColor: '#fff' },
  { id: 'apple',      name: 'Apple TV+',    tmdbId: 350,  color: '#555555', textColor: '#fff' },
  { id: 'paramount',  name: 'Paramount+',   tmdbId: 531,  color: '#0064FF', textColor: '#fff' },
  { id: 'peacock',    name: 'Peacock',      tmdbId: 386,  color: '#000000', textColor: '#fff' },
  { id: 'crunchyroll',name: 'Crunchyroll',  tmdbId: 283,  color: '#F47521', textColor: '#fff' },
  { id: 'oneplay',    name: 'Oneplay',      tmdbId: 2536, color: '#E4002B', textColor: '#fff' },
];

export const REGIONS = [
  { code: 'CZ', name: 'Česká republika' },
  { code: 'SK', name: 'Slovensko' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'PL', name: 'Poland' },
  { code: 'AT', name: 'Austria' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
];

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export const SORT_OPTIONS = [
  { value: 'vote_average.desc', label: 'Hodnocení (nejlepší)' },
  { value: 'release_date.desc', label: 'Datum vydání (nejnovější)' },
  { value: 'popularity.desc', label: 'Popularita' },
  { value: 'title.asc', label: 'Název (A–Z)' },
] as const;

export function getServiceById(id: string): StreamingService | undefined {
  return STREAMING_SERVICES.find(s => s.id === id);
}

export function getServiceByTmdbId(tmdbId: number): StreamingService | undefined {
  return STREAMING_SERVICES.find(s =>
    s.tmdbId === tmdbId || s.tmdbIds?.includes(tmdbId)
  );
}

/** Vrátí všechna TMDB ID pro danou službu (hlavní + alternativní) */
export function getAllTmdbIds(service: StreamingService): number[] {
  if (service.tmdbIds && service.tmdbIds.length > 0) return service.tmdbIds;
  return [service.tmdbId];
}

export function getWatchUrl(
  serviceId: string,
  title: string,
  tmdbLink?: string
): string {
  if (tmdbLink) return tmdbLink;

  switch (serviceId) {
    case 'netflix':
      return `https://www.netflix.com/search?q=${encodeURIComponent(title)}`;
    case 'disney':
      return `https://www.disneyplus.com/search/${encodeURIComponent(title)}`;
    case 'max':
      return 'https://www.hbomax.com';
    case 'prime':
      return `https://www.amazon.com/s?k=${encodeURIComponent(title)}&i=instant-video`;
    case 'apple':
      return `https://tv.apple.com/search?term=${encodeURIComponent(title)}`;
    case 'paramount':
      return `https://www.paramountplus.com/search/?query=${encodeURIComponent(title)}`;
    case 'peacock':
      return `https://www.peacocktv.com/search?q=${encodeURIComponent(title)}`;
    case 'crunchyroll':
      return `https://www.crunchyroll.com/search?q=${encodeURIComponent(title)}`;
    case 'oneplay':
      return `https://www.oneplay.cz/hledat?q=${encodeURIComponent(title)}`;
    default:
      return `https://www.google.com/search?q=${encodeURIComponent(title + ' watch online')}`;
  }
}
