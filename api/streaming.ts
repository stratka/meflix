export default async function handler(req: any, res: any) {
  const key = (process.env.RAPIDAPI_KEY || '').trim();
  if (!key) return res.status(503).json({ error: 'RAPIDAPI_KEY not configured' });

  const tmdbId = Array.isArray(req.query.tmdbId) ? req.query.tmdbId[0] : req.query.tmdbId;
  const country = Array.isArray(req.query.country) ? req.query.country[0] : req.query.country;

  if (!tmdbId || !country) return res.status(400).json({ error: 'Missing tmdbId or country' });

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
