import { useEffect, useState } from 'react';
import { resolveDarkMode, THEME_CHANGE_EVENT } from '../utils/theme';

/** Whether app surfaces (dashboard/public) should use scoped dark styling. */
export default function useAppThemeDark() {
  const [dark, setDark] = useState(() => resolveDarkMode());

  useEffect(() => {
    const onThemeChange = (event) => {
      setDark(event.detail?.dark ?? resolveDarkMode());
    };
    const onSystemChange = () => {
      const mode = localStorage.getItem('medscan_theme') || 'system';
      if (mode === 'system') setDark(resolveDarkMode('system'));
    };

    window.addEventListener(THEME_CHANGE_EVENT, onThemeChange);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', onSystemChange);
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange);
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', onSystemChange);
    };
  }, []);

  return dark;
}
