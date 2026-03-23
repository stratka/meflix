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
    return res.status(response.status).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: 'TMDB fetch failed', detail: err?.message });
  }
}
