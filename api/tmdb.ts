function getCacheTtl(tmdbPath: string): number {
  if (tmdbPath.startsWith('genre/')) return 86400;           // genres: 24 h
  if (tmdbPath.startsWith('watch/providers')) return 21600;  // providers: 6 h
  if (tmdbPath.startsWith('discover/')) return 3600;         // discover: 1 h
  if (tmdbPath.match(/^(movie|tv)\/\d+$/)) return 43200;     // detail: 12 h
  if (tmdbPath.startsWith('search/person')) return 3600;     // person search: 1 h
  if (tmdbPath.startsWith('search/')) return 600;            // text search: 10 min
  return 1800;                                               // default: 30 min
}

export default async function handler(req: any, res: any) {
  const key = (process.env.TMDB_API_KEY || '').trim();
  if (!key) return res.status(500).json({ error: 'TMDB_API_KEY not configured' });

  const { _path, ...rest } = req.query;
  const tmdbPath = Array.isArray(_path) ? _path[0] : (_path || '');

  const url = new URL(`https://api.themoviedb.org/3/${tmdbPath}`);
  Object.entries(rest).forEach(([k, v]) => {
    if (v !== undefined) url.searchParams.set(k, String(v));
  });

  try {
    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    if (response.ok) {
      const ttl = getCacheTtl(tmdbPath);
      res.setHeader('Cache-Control', `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 2}`);
    }
    return res.status(response.status).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: 'TMDB fetch failed', detail: err?.message });
  }
}
