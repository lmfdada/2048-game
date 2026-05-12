import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  base: '/2048-game/',
  server: {
    host: true,
    port: 5173,
  },
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11', 'Android >= 4.4', 'iOS >= 9'],
    }),
  ],
});
