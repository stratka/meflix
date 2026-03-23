export default async function handler(req: any, res: any) {
  const parts: string[] = Array.isArray(req.query.path)
    ? req.query.path
    : [req.query.path].filter(Boolean);

  // /api/tmdb/genre/movie/list?language=cs-CZ
  if (parts[0] === 'tmdb') {
    const tmdbPath = parts.slice(1).join('/');
    const key = (process.env.TMDB_API_KEY || '').trim();
    if (!key) return res.status(500).json({ error: 'TMDB_API_KEY not configured' });

    const url = new URL(`https://api.themoviedb.org/3/${tmdbPath}`);
    const { path: _p, ...restQuery } = req.query;
    Object.entries(restQuery).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });

    try {
      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (err: any) {
      return res.status(500).json({ error: 'TMDB fetch failed', detail: err?.message });
    }
  }

  // /api/streaming/12345?country=CZ
  if (parts[0] === 'streaming') {
    const tmdbId = parts[1];
    const country = req.query.country;
    if (!tmdbId || !country) return res.status(400).json({ error: 'Missing tmdbId or country' });

    const key = (process.env.RAPIDAPI_KEY || '').trim();
    if (!key) return res.status(503).json({ error: 'RAPIDAPI_KEY not configured' });

    try {
      const url = `https://streaming-availability.p.rapidapi.com/shows/movie/${tmdbId}?country=${country}`;
      const response = await fetch(url, {
        headers: {
          'x-rapidapi-key': key,
          'x-rapidapi-host': 'streaming-availability.p.rapidapi.com',
        },
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (err: any) {
      return res.status(500).json({ error: 'Streaming fetch failed', detail: err?.message });
    }
  }

  return res.status(404).json({ error: 'Unknown route', parts });
}
