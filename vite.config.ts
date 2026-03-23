import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api/tmdb': {
          target: 'https://api.themoviedb.org/3',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/tmdb/, ''),
          headers: { Authorization: `Bearer ${env.TMDB_API_KEY}` },
        },
        '/api/streaming': {
          target: 'https://streaming-availability.p.rapidapi.com/shows/movie',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/streaming/, ''),
          headers: {
            'x-rapidapi-key': env.RAPIDAPI_KEY || '',
            'x-rapidapi-host': 'streaming-availability.p.rapidapi.com',
          },
        },
      },
    },
  };
});
