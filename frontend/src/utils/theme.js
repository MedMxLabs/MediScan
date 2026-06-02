/** Theme preference helpers — dark mode is scoped via `.theme-dark`, not on `<html>`. */

export const THEME_CHANGE_EVENT = 'medscan-theme-change';

export function resolveDarkMode(theme) {
  const mode =
    theme ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('medscan_theme') : null) ?? 'system';
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

/** Persist preference and notify layouts (landing/auth stay light). */
export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  const mode = theme || localStorage.getItem('medscan_theme') || 'system';
  localStorage.setItem('medscan_theme', mode);
  document.documentElement.classList.remove('dark');
  const dark = resolveDarkMode(mode);
  document.documentElement.dataset.medscanTheme = dark ? 'dark' : 'light';
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { dark, mode } }));
}

export function initThemeFromStorage() {
  applyTheme(localStorage.getItem('medscan_theme') || 'system');
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const mode = localStorage.getItem('medscan_theme') || 'system';
      if (mode === 'system') applyTheme('system');
    });
  }
}
