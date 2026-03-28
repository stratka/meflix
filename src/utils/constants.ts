import type { StreamingService } from '../types/app';

export const STREAMING_SERVICES: StreamingService[] = [
  // Globální
  { id: 'netflix',    name: 'Netflix',          tmdbId: 8,    color: '#E50914', textColor: '#fff' },
  { id: 'disney',     name: 'Disney+',          tmdbId: 337,  color: '#006E99', textColor: '#fff' },
  { id: 'max',        name: 'Max',              tmdbId: 1899, tmdbIds: [1899, 29, 384], color: '#002BE7', textColor: '#fff' },
  { id: 'prime',      name: 'Prime Video',      tmdbId: 9,    tmdbIds: [9, 119, 10],   color: '#00A8E1', textColor: '#fff' },
  { id: 'apple',      name: 'Apple TV+',        tmdbId: 350,  color: '#555555', textColor: '#fff' },
  { id: 'paramount',  name: 'Paramount+',       tmdbId: 531,  tmdbIds: [531, 582, 2303, 2616], color: '#0064FF', textColor: '#fff' },
  { id: 'peacock',    name: 'Peacock',          tmdbId: 386,  color: '#000000', textColor: '#fff' },
  { id: 'crunchyroll',name: 'Crunchyroll',      tmdbId: 283,  tmdbIds: [283, 1968], color: '#F47521', textColor: '#fff' },
  { id: 'mubi',       name: 'MUBI',             tmdbId: 11,   color: '#171A1B', textColor: '#fff' },
  { id: 'canal',      name: 'Canal+',           tmdbId: 381,  color: '#000000', textColor: '#fff' },
  // CZ / SK
  { id: 'prima',      name: 'Prima+',           tmdbId: 1928, color: '#E8002D', textColor: '#fff' },
  { id: 'voyo',       name: 'Voyo',             tmdbId: 627,  color: '#FF4E00', textColor: '#fff' },
  { id: 'oneplay',    name: 'Oneplay',          tmdbId: 2536, color: '#E4002B', textColor: '#fff' },
  { id: 'skyshowtime',name: 'SkyShowtime',      tmdbId: 1773, color: '#003865', textColor: '#fff' },
  // US
  { id: 'hulu',       name: 'Hulu',             tmdbId: 15,   color: '#1CE783', textColor: '#000' },
  { id: 'amc',        name: 'AMC+',             tmdbId: 526,  tmdbIds: [526, 528, 635], color: '#1B1B1B', textColor: '#fff' },
  { id: 'fubo',       name: 'fuboTV',           tmdbId: 257,  color: '#FA4616', textColor: '#fff' },
  // DE / AT
  { id: 'rtlplus',    name: 'RTL+',             tmdbId: 298,  color: '#E5000A', textColor: '#fff' },
  { id: 'joyn',       name: 'Joyn',             tmdbId: 304,  color: '#04D26D', textColor: '#000' },
  { id: 'ard',        name: 'ARD Mediathek',    tmdbId: 219,  color: '#003366', textColor: '#fff' },
  { id: 'magenta',    name: 'MagentaTV',        tmdbId: 178,  tmdbIds: [178, 1856], color: '#E20074', textColor: '#fff' },
  { id: 'wow',        name: 'WOW',              tmdbId: 30,   color: '#2B2D42', textColor: '#fff' },
  // GB
  { id: 'bbc',        name: 'BBC iPlayer',      tmdbId: 38,   color: '#BB1919', textColor: '#fff' },
  { id: 'itvx',       name: 'ITVX',             tmdbId: 41,   color: '#282828', textColor: '#fff' },
  { id: 'ch4',        name: 'Channel 4',        tmdbId: 103,  color: '#00539F', textColor: '#fff' },
  // FR
  { id: 'm6',         name: 'M6+',              tmdbId: 147,  color: '#F7941D', textColor: '#000' },
  // IT
  { id: 'rai',        name: 'Rai Play',         tmdbId: 222,  color: '#009246', textColor: '#fff' },
  { id: 'mediaset',   name: 'Mediaset Infinity',tmdbId: 359,  color: '#0055A5', textColor: '#fff' },
  { id: 'tim',        name: 'TIMvision',        tmdbId: 109,  color: '#5D2D91', textColor: '#fff' },
  // ES
  { id: 'atres',      name: 'Atres Player',     tmdbId: 62,   color: '#FF6600', textColor: '#fff' },
  { id: 'filmin',     name: 'Filmin',           tmdbId: 63,   color: '#7B2D8B', textColor: '#fff' },
  { id: 'rtve',       name: 'RTVE Play',        tmdbId: 541,  color: '#004996', textColor: '#fff' },
  { id: 'movistar',   name: 'Movistar+',        tmdbId: 2241, color: '#009900', textColor: '#fff' },
  // PL / Nordic
  { id: 'viaplay',    name: 'Viaplay',          tmdbId: 76,   color: '#0060FF', textColor: '#fff' },
  { id: 'player',     name: 'Player.pl',        tmdbId: 505,  color: '#E8002D', textColor: '#fff' },
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
    case 'skyshowtime':
      return `https://www.skyshowtime.com/search?q=${encodeURIComponent(title)}`;
    case 'prima':
      return `https://prima.iprima.cz/hledat?q=${encodeURIComponent(title)}`;
    case 'voyo':
      return `https://voyo.nova.cz/hledat?q=${encodeURIComponent(title)}`;
    case 'mubi':
      return `https://mubi.com/search/${encodeURIComponent(title)}`;
    case 'canal':
      return `https://www.canalplus.com/recherche/?q=${encodeURIComponent(title)}`;
    case 'hulu':
      return `https://www.hulu.com/search?q=${encodeURIComponent(title)}`;
    case 'amc':
      return `https://www.amcplus.com/search?q=${encodeURIComponent(title)}`;
    case 'fubo':
      return `https://www.fubo.tv/search?q=${encodeURIComponent(title)}`;
    case 'rtlplus':
      return `https://plus.rtl.de/suche?q=${encodeURIComponent(title)}`;
    case 'joyn':
      return `https://www.joyn.de/suche?q=${encodeURIComponent(title)}`;
    case 'ard':
      return `https://www.ardmediathek.de/suche/${encodeURIComponent(title)}`;
    case 'magenta':
      return `https://www.magentatv.de/suche?q=${encodeURIComponent(title)}`;
    case 'wow':
      return `https://www.wowtv.de/suche?q=${encodeURIComponent(title)}`;
    case 'bbc':
      return `https://www.bbc.co.uk/iplayer/search?q=${encodeURIComponent(title)}`;
    case 'itvx':
      return `https://www.itv.com/search?term=${encodeURIComponent(title)}`;
    case 'ch4':
      return `https://www.channel4.com/search?q=${encodeURIComponent(title)}`;
    case 'm6':
      return `https://www.m6plus.fr/recherche?q=${encodeURIComponent(title)}`;
    case 'rai':
      return `https://www.raiplay.it/ricerca.html?q=${encodeURIComponent(title)}`;
    case 'mediaset':
      return `https://www.mediasetinfinity.it/ricerca?query=${encodeURIComponent(title)}`;
    case 'tim':
      return `https://www.timvision.it/search?q=${encodeURIComponent(title)}`;
    case 'atres':
      return `https://www.atresplayer.com/search/?q=${encodeURIComponent(title)}`;
    case 'filmin':
      return `https://www.filmin.es/buscar?q=${encodeURIComponent(title)}`;
    case 'rtve':
      return `https://www.rtve.es/play/buscar/?q=${encodeURIComponent(title)}`;
    case 'movistar':
      return `https://www.movistarplus.es/buscar/${encodeURIComponent(title)}`;
    case 'viaplay':
      return `https://viaplay.com/search?q=${encodeURIComponent(title)}`;
    case 'player':
      return `https://player.pl/szukaj/${encodeURIComponent(title)}`;
    default:
      return `https://www.google.com/search?q=${encodeURIComponent(title + ' watch online')}`;
  }
}
