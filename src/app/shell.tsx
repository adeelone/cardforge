import { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { FolderOpen, LayoutTemplate, Moon, Pencil, Plus, Settings, ShieldCheck, Sun, Users } from 'lucide-react';
import { applyTheme, getThemePreference, setThemePreference, useSystemThemeSync } from './theme';

const links = [
  { to: '/new', label: 'Editor', icon: Pencil },
  { to: '/templates', label: 'Templates', icon: LayoutTemplate },
  { to: '/library', label: 'My cards', icon: FolderOpen },
  { to: '/organizations', label: 'For teams', icon: Users },
  { to: '/trust', label: 'Trust', icon: ShieldCheck }
];

function currentResolved() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function AppShell() {
  useSystemThemeSync();
  const [resolved, setResolved] = useState(currentResolved());

  function toggleTheme() {
    const next = currentResolved() === 'dark' ? 'light' : 'dark';
    setThemePreference(next);
    applyTheme(next);
    setResolved(next);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label="CardForge home">
          <span className="brand-mark" aria-hidden="true">CF</span>
          <span className="brand-name">CardForge</span>
        </NavLink>
        <nav aria-label="Primary navigation">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink key={link.to} to={link.to} className="nav-link">
                <Icon aria-hidden="true" size={17} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="topbar-actions">
          <span className="local-status" title="Designs stay in this browser"><span /> Local only</span>
          <button type="button" className="icon-button" onClick={toggleTheme} aria-label="Toggle color theme" title="Toggle theme">
            {resolved === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <Link to="/settings" className="icon-button link-button" aria-label="Settings" title="Settings"><Settings size={17} /></Link>
          <Link to="/new" className="primary-button compact"><Plus size={16} />New card</Link>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

// Keep the initial paint in sync if this module loads before main applies theme.
applyTheme(getThemePreference());
