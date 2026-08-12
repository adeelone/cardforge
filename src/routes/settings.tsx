import { useState } from 'react';
import { Monitor, Moon, Sun, Trash2 } from 'lucide-react';
import {
  getThemePreference,
  getUnits,
  setThemePreference,
  setUnits,
  type ThemePreference,
  type Units
} from '../app/theme';
import { toast } from '../lib/toast';

const THEMES: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon }
];

export function SettingsRoute() {
  const [theme, setTheme] = useState<ThemePreference>(getThemePreference());
  const [units, setUnitsState] = useState<Units>(getUnits());

  function chooseTheme(value: ThemePreference) {
    setTheme(value);
    setThemePreference(value);
  }

  function chooseUnits(value: Units) {
    setUnitsState(value);
    setUnits(value);
  }

  async function clearAll() {
    if (!window.confirm('Delete all locally stored designs and settings? This cannot be undone.')) return;
    localStorage.clear();
    if ('indexedDB' in window) indexedDB.deleteDatabase('keyval-store');
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
    toast('Local data cleared');
    setTimeout(() => window.location.reload(), 600);
  }

  return (
    <main className="page settings">
      <header className="page-header">
        <h1>Settings</h1>
        <p>Appearance and workspace defaults. Everything stays on this device.</p>
      </header>

      <section className="setting-block">
        <h2>Appearance</h2>
        <div className="segmented">
          {THEMES.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                className={theme === option.value ? 'seg on' : 'seg'}
                onClick={() => chooseTheme(option.value)}
                aria-pressed={theme === option.value}
              >
                <Icon size={16} />
                {option.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="setting-block">
        <h2>Units</h2>
        <div className="segmented">
          <button type="button" className={units === 'mm' ? 'seg on' : 'seg'} onClick={() => chooseUnits('mm')} aria-pressed={units === 'mm'}>Millimeters</button>
          <button type="button" className={units === 'in' ? 'seg on' : 'seg'} onClick={() => chooseUnits('in')} aria-pressed={units === 'in'}>Inches</button>
        </div>
      </section>

      <section className="setting-block">
        <h2>Privacy & data</h2>
        <p className="muted">
          CardForge stores your designs in this browser (IndexedDB). Export JSON to back them up before clearing browser data or moving devices.
        </p>
        <button type="button" className="danger-button" onClick={() => void clearAll()}><Trash2 size={15} />Delete all local data</button>
      </section>
    </main>
  );
}
