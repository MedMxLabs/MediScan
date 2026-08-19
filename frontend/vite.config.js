import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
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
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['medmx-logo.png', 'apple-touch-icon.png'],
        manifest: {
          name: 'MedMx LABS',
          short_name: 'MedMx',
          description:
            'Smart medicine price comparison, prescriptions, reminders, and health insights for India.',
          theme_color: '#0a192f',
          background_color: '#0a192f',
          display: 'standalone',
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/',
          categories: ['health', 'medical', 'productivity'],
          icons: [
            {
              src: 'medmx-logo.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'medmx-logo.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'medmx-logo.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          shortcuts: [
            {
              name: 'Search medicines',
              short_name: 'Search',
              url: '/search',
              icons: [{ src: 'medmx-logo.png', sizes: '192x192' }],
            },
            {
              name: 'Upload prescription',
              short_name: 'Upload',
              url: '/upload',
              icons: [{ src: 'medmx-logo.png', sizes: '192x192' }],
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webmanifest}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'medscan-api',
                networkTimeoutSeconds: 12,
                expiration: { maxEntries: 48, maxAgeSeconds: 60 * 5 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
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
