import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import type { IncomingMessage, ServerResponse } from 'http';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-proxy',
        configureServer(server) {
          server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
            const url = new URL(req.url || '/', 'http://localhost');

            // /api/tmdb?_path=genre/movie/list&language=cs-CZ
            if (url.pathname === '/api/tmdb') {
              const tmdbPath = url.searchParams.get('_path') || '';
              url.searchParams.delete('_path');
              const targetUrl = `https://api.themoviedb.org/3/${tmdbPath}?${url.searchParams}`;
              try {
                const r = await fetch(targetUrl, {
                  headers: { Authorization: `Bearer ${env.TMDB_API_KEY}`, 'Content-Type': 'application/json' },
                });
                const data = await r.json();
                res.writeHead(r.status, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data));
              } catch (e) {
                res.writeHead(500); res.end(JSON.stringify({ error: String(e) }));
              }
              return;
            }

            // /api/streaming?tmdbId=12345&country=cz
            if (url.pathname === '/api/streaming') {
              const tmdbId = url.searchParams.get('tmdbId');
              const country = url.searchParams.get('country');
              const targetUrl = `https://streaming-availability.p.rapidapi.com/shows/movie/${tmdbId}?country=${country}`;
              try {
                const r = await fetch(targetUrl, {
                  headers: {
                    'x-rapidapi-key': env.RAPIDAPI_KEY || '',
                    'x-rapidapi-host': 'streaming-availability.p.rapidapi.com',
                  },
                });
                const data = await r.json();
                res.writeHead(r.status, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data));
              } catch (e) {
                res.writeHead(500); res.end(JSON.stringify({ error: String(e) }));
              }
              return;
            }

            next();
          });
        },
      },
    ],
  };
});
