export default async function handler(req: any, res: any) {
  const key = (process.env.TMDB_API_KEY || '').trim();
  res.status(200).json({
    keySet: !!key,
    keyLength: key.length,
    keyStart: key.slice(0, 10),
    keyEnd: key.slice(-10),
  });
}
