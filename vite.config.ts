import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    // Allow the hosted live-preview proxy host (plus localhost).
    allowedHosts: ['localhost', '.e2b.app'],
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: ['localhost', '.e2b.app'],
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
  },
});
