export default async function handler(req: any, res: any) {
  const key = (process.env.TMDB_API_KEY || '').trim();
  if (!key) {
    return res.status(500).json({ error: 'TMDB_API_KEY not set' });
  }

  const pathParts = req.query.path;
  const tmdbPath = Array.isArray(pathParts) ? pathParts.join('/') : (pathParts || '');

  const url = new URL(`https://api.themoviedb.org/3/${tmdbPath}`);
  const { path: _path, ...restQuery } = req.query;
  Object.entries(restQuery).forEach(([k, v]) => {
    if (v !== undefined) url.searchParams.set(k, String(v));
  });

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch from TMDB', detail: err?.message });
  }
}
