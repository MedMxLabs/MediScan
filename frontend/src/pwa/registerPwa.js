import { registerSW } from 'virtual:pwa-register';

let updateSW = null;

export function initPwa() {
  if (import.meta.env.DEV) return;

  updateSW = registerSW({
    immediate: true,
    onOfflineReady() {
      window.dispatchEvent(new CustomEvent('medscan-pwa-offline-ready'));
    },
    onNeedRefresh() {
      window.dispatchEvent(new CustomEvent('medscan-pwa-need-refresh'));
    },
    onRegisteredSW(_url, registration) {
      if (registration) {
        setInterval(
          () => registration.update().catch(() => {}),
          60 * 60 * 1000,
        );
      }
    },
  });

  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  if (standalone) {
    document.documentElement.classList.add('pwa-standalone');
  }
}

export function applyPwaUpdate() {
  updateSW?.(true);
}
