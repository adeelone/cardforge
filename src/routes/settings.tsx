import { useState } from 'react';

export function SettingsRoute() {
  const [theme, setTheme] = useState(localStorage.getItem('cardforge:theme') ?? 'system');
  const [units, setUnits] = useState(localStorage.getItem('cardforge:units') ?? 'mm');

  function save() {
    localStorage.setItem('cardforge:theme', theme);
    localStorage.setItem('cardforge:units', units);
  }

  async function clearAll() {
    localStorage.clear();
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    window.location.reload();
  }

  return (
    <main className="page settings">
      <header className="page-header">
        <h1>Settings</h1>
        <p>Defaults for the local editor and privacy controls.</p>
      </header>
      <label>Theme<select value={theme} onChange={(event) => setTheme(event.target.value)}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
      <label>Units<select value={units} onChange={(event) => setUnits(event.target.value)}><option value="mm">Millimeters</option><option value="in">Inches</option></select></label>
      <button type="button" className="primary-button" onClick={save}>Save settings</button>
      <button type="button" className="danger-button" onClick={() => void clearAll()}>Delete all local data</button>
    </main>
  );
}
