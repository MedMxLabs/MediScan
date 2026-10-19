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
        includeAssets: ['pwa-192x192.png', 'apple-touch-icon.png'],
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
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'maskable-512x512.png',
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
              icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
            },
            {
              name: 'Upload prescription',
              short_name: 'Upload',
              url: '/upload',
              icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,webp,svg,woff2,webmanifest}'],
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
          // Groups also capture their dependencies, so vendor must outrank charts: recharts imports
          // react/redux, and if charts claims them the entry has to preload the whole chart bundle.
          codeSplitting: {
            groups: [
              {
                name: 'vendor',
                test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|react-redux|redux|redux-thunk|@reduxjs|immer|reselect|use-sync-external-store|scheduler|react-is)[\\/]/,
                priority: 3,
              },
              { name: 'motion', test: /[\\/]node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/, priority: 2 },
              { name: 'charts', test: /[\\/]node_modules[\\/]recharts[\\/]/, priority: 1 },
            ],
          },
        },
      },
    },
  };
});
