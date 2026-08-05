import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so dist works on GitHub Pages (any path) and local preview
  base: './',
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
});
