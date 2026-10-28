import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '127.0.0.1',
    proxy: {
      '/api/adsb-fi': {
        target: 'https://opendata.adsb.fi',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/adsb-fi/, '/api/v3'),
      },
    },
  },
});
