import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, '');
  const apiTarget = env.MEDSCAN_API_PROXY || 'http://127.0.0.1:5000';
  const proxy = {
    '/api': { target: apiTarget, changeOrigin: true, secure: false, timeout: 240_000 },
    '/health': { target: apiTarget, changeOrigin: true, secure: false },
  };

  return {
    plugins: [react(), tailwindcss()],
    server: { proxy },
    preview: { proxy },
    build: {
      outDir: 'dist',
      sourcemap: false,
      target: 'es2020',
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('recharts')) return 'charts';
            if (id.includes('framer-motion')) return 'motion';
            if (id.includes('react') || id.includes('redux') || id.includes('@reduxjs')) return 'vendor';
          },
        },
      },
    },
  };
});
