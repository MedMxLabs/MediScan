import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store/store.js';
import { loginSuccess } from './store/slices/authSlice';
import { restoreAuthSession } from './auth/session';
import { isSupabaseAuthCallbackRoute } from './lib/supabase.js';
import { redirectOAuthCodeToCallback } from './lib/oauthRedirectGuard.js';
import './index.css';
import App from './App.jsx';
import OmnidimensionWidget from './components/OmnidimensionWidget.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { initThemeFromStorage, applyTheme } from './utils/theme.js';
import { initPwa } from './pwa/registerPwa.js';

initThemeFromStorage();
initPwa();
redirectOAuthCodeToCallback();

;(async () => {
  try {
    if (isSupabaseAuthCallbackRoute()) return;
    const restored = await restoreAuthSession();
    if (restored?.profile) {
      store.dispatch(loginSuccess(restored.profile));
      const savedTheme = localStorage.getItem('medscan_theme');
      if (savedTheme) applyTheme(savedTheme);
    }
  } catch {
    /* ignore corrupt storage */
  }
})();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <OmnidimensionWidget />
        <App />
      </Provider>
    </ErrorBoundary>
  </StrictMode>,
);
