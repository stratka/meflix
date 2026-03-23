// Streaming Availability API (Movie of the Night) přes Vercel serverless proxy

const CACHE_VERSION = 'v2';
const CACHE_PREFIX = `sa_cache_${CACHE_VERSION}_`;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dní

interface StreamingOption {
  service: string | { id: string };
  type: string;
  link: string;
}

interface ShowResultV3 {
  streamingInfo: Record<string, Record<string, { link?: string }[]>>;
}

const SERVICE_ID_MAP: Record<string, string> = {
  netflix: 'netflix',
  disney: 'disney',
  hbo: 'max',
  max: 'max',
  hbomax: 'max',
  prime: 'prime',
  amazon: 'prime',
  apple: 'apple',
  appletv: 'apple',
  paramount: 'paramount',
  peacock: 'peacock',
  crunchyroll: 'crunchyroll',
};

export interface DirectStreamingLinks {
  [serviceId: string]: string;
}

interface CacheEntry {
  links: DirectStreamingLinks;
  timestamp: number;
}

function getCacheKey(tmdbId: number, country: string) {
  return `${CACHE_PREFIX}${tmdbId}_${country}`;
}

function loadFromCache(tmdbId: number, country: string): DirectStreamingLinks | null {
  try {
    const raw = localStorage.getItem(getCacheKey(tmdbId, country));
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(getCacheKey(tmdbId, country));
      return null;
    }
    return entry.links;
  } catch {
    return null;
  }
}

function saveToCache(tmdbId: number, country: string, links: DirectStreamingLinks) {
  try {
    localStorage.setItem(getCacheKey(tmdbId, country), JSON.stringify({ links, timestamp: Date.now() }));
  } catch { /* ignore */ }
}

function normalizeNetflixUrl(url: string): string {
  return url.replace(/netflix\.com\/watch\/(\d+)/, 'netflix.com/title/$1');
}

function parseLinks(data: unknown, country: string): DirectStreamingLinks {
  const links: DirectStreamingLinks = {};
  const d = data as Record<string, unknown>;

  // API v4
  const v4Options = (d.streamingOptions as Record<string, StreamingOption[]> | undefined)?.[country];
  if (v4Options && Array.isArray(v4Options)) {
    for (const option of v4Options) {
      if (option.type !== 'subscription') continue;
      const serviceId = typeof option.service === 'string' ? option.service : option.service?.id;
      const ourId = serviceId ? SERVICE_ID_MAP[serviceId] : undefined;
      if (ourId && option.link) {
        links[ourId] = ourId === 'netflix' ? normalizeNetflixUrl(option.link) : option.link;
      }
    }
    return links;
  }

  // API v3
  const v3Info = (d.streamingInfo as ShowResultV3['streamingInfo'] | undefined)?.[country];
  if (v3Info && typeof v3Info === 'object') {
    for (const [serviceName, entries] of Object.entries(v3Info)) {
      const ourId = SERVICE_ID_MAP[serviceName.toLowerCase()];
      if (ourId && Array.isArray(entries) && entries[0]?.link) {
        const rawLink = entries[0].link;
        links[ourId] = ourId === 'netflix' ? normalizeNetflixUrl(rawLink) : rawLink;
      }
    }
  }

  return links;
}

export class RateLimitError extends Error {
  constructor() { super('rate_limit'); this.name = 'RateLimitError'; }
}

export class NotSubscribedError extends Error {
  constructor() { super('not_subscribed'); this.name = 'NotSubscribedError'; }
}

export async function fetchDirectStreamingLinks(
  tmdbId: number,
  region: string
): Promise<DirectStreamingLinks> {
  const country = region.toLowerCase();

  const cached = loadFromCache(tmdbId, country);
  if (cached) return cached;

  // Volá náš Vercel serverless proxy — klíč je na serveru
  const res = await fetch(`/api/streaming/${tmdbId}?country=${country}`);

  if (res.status === 429) throw new RateLimitError();
  if (res.status === 403) throw new NotSubscribedError();
  if (res.status === 503) {
    // API není nakonfigurováno na serveru
    return {};
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Streaming Availability API error: ${res.status} ${body}`);
  }

  const data = await res.json();
  const links = parseLinks(data, country);
  saveToCache(tmdbId, country, links);
  return links;
}
