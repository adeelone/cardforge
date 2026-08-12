import { useEffect, useSyncExternalStore } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';
export type Units = 'mm' | 'in';

const THEME_KEY = 'cardforge:theme';
const UNITS_KEY = 'cardforge:units';

export function getThemePreference(): ThemePreference {
  const value = localStorage.getItem(THEME_KEY);
  return value === 'light' || value === 'dark' ? value : 'system';
}

export function getUnits(): Units {
  return localStorage.getItem(UNITS_KEY) === 'in' ? 'in' : 'mm';
}

function resolve(pref: ThemePreference): 'light' | 'dark' {
  if (pref === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return pref;
}

/** Apply the theme to <html> and keep the meta theme-color in sync. */
export function applyTheme(pref: ThemePreference = getThemePreference()) {
  const resolved = resolve(pref);
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', resolved === 'dark' ? '#16130d' : '#f2ece0');
  window.dispatchEvent(new CustomEvent('cardforge:theme', { detail: pref }));
}

export function setThemePreference(pref: ThemePreference) {
  localStorage.setItem(THEME_KEY, pref);
  applyTheme(pref);
}

export function setUnits(units: Units) {
  localStorage.setItem(UNITS_KEY, units);
  window.dispatchEvent(new CustomEvent('cardforge:units', { detail: units }));
}

/** React hook that re-renders when the stored units change. */
export function useUnits(): Units {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener('cardforge:units', callback);
      window.addEventListener('storage', callback);
      return () => {
        window.removeEventListener('cardforge:units', callback);
        window.removeEventListener('storage', callback);
      };
    },
    () => getUnits(),
    () => 'mm'
  );
}

/** Keep 'system' preference reactive to OS theme changes. */
export function useSystemThemeSync() {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (getThemePreference() === 'system') applyTheme('system');
    };
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);
}
