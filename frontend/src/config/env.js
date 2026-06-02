export const env = {
  apiUrl: (import.meta.env.VITE_API_URL || '').replace(/\/+$/, ''),
  omnidimensionSecret: import.meta.env.VITE_OMNIDIMENSION_WIDGET_SECRET || '',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  appName: import.meta.env.VITE_APP_NAME || 'MedMx LABS',
}
