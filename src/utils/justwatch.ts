import { getServiceByTmdbId } from './constants';
import type { DirectStreamingLinks } from './streamingAvailability';

const CACHE_VERSION = 'jw_v1';
const CACHE_PREFIX = `${CACHE_VERSION}_`;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dní

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

export async function fetchJustWatchLinks(
  tmdbId: number,
  region: string,
  title: string,
  mediaType: 'movie' | 'tv' = 'movie'
): Promise<DirectStreamingLinks> {
  const country = region.toUpperCase();
  const cacheKey_lower = region.toLowerCase();

  const cached = loadFromCache(tmdbId, cacheKey_lower);
  if (cached) return cached;

  try {
    const params = new URLSearchParams({
      tmdbId: String(tmdbId),
      country,
      mediaType,
      title,
    });
    const res = await fetch(`/api/justwatch?${params}`);
    if (!res.ok) return {};

    const data = await res.json();
    const offers: { standardWebURL: string; package: { packageId: number; technicalName: string } }[] = data.offers || [];

    const links: DirectStreamingLinks = {};

    for (const offer of offers) {
      if (!offer.standardWebURL || !offer.package?.packageId) continue;
      const service = getServiceByTmdbId(offer.package.packageId);
      if (service && !links[service.id]) {
        links[service.id] = offer.standardWebURL;
      }
    }

    saveToCache(tmdbId, cacheKey_lower, links);
    return links;
  } catch {
    return {};
  }
}
