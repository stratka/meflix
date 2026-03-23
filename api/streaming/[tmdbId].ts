export default async function handler(req: any, res: any) {
  const { tmdbId, country } = req.query;
  const id = Array.isArray(tmdbId) ? tmdbId[0] : tmdbId;

  if (!id || !country) {
    return res.status(400).json({ error: 'Missing tmdbId or country' });
  }

  if (!process.env.RAPIDAPI_KEY) {
    return res.status(503).json({ error: 'Streaming API not configured' });
  }

  try {
    const url = `https://streaming-availability.p.rapidapi.com/shows/movie/${id}?country=${country}`;
    const response = await fetch(url, {
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'streaming-availability.p.rapidapi.com',
      },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch streaming data' });
  }
}
