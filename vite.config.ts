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
      '/api/celestrak-stations': {
        target: 'https://celestrak.org',
        changeOrigin: true,
        rewrite: () => '/NORAD/elements/gp.php?GROUP=STATIONS&FORMAT=JSON',
      },
      '/api/launch-library-upcoming': {
        target: 'https://ll.thespacedevs.com',
        changeOrigin: true,
        rewrite: () => '/2.3.0/launches/upcoming/?hide_recent_previous=True&limit=8&mode=normal',
      },
    },
  },
});
