import { Suspense, useEffect, useState } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { FolderOpen, Gem, LayoutTemplate, Moon, Pencil, Plus, Settings, Sun, UserRound, Users } from 'lucide-react';
import { applyTheme, getThemePreference, setThemePreference, useSystemThemeSync } from './theme';
import { Seo } from './seo';
import { cloudEnabled } from '../lib/cloud/client';
import { useSession } from '../lib/cloud/session';
import { PLANS } from '../lib/plans';

const links = [
  { to: '/new', label: 'Editor', icon: Pencil },
  { to: '/templates', label: 'Templates', icon: LayoutTemplate },
  { to: '/library', label: 'My cards', icon: FolderOpen },
  { to: '/organizations', label: 'For teams', icon: Users },
  { to: '/pricing', label: 'Pricing', icon: Gem }
];

function AccountControl() {
  const status = useSession((state) => state.status);
  const user = useSession((state) => state.user);
  const plan = useSession((state) => state.overview?.plan ?? 'free');
  if (!cloudEnabled) return <span className="local-status" title="Designs stay in this browser"><span /> Local only</span>;
  if (status === 'signed-in' && user) {
    const initial = (user.displayName || user.email).trim().charAt(0).toUpperCase() || '?';
    return (
      <Link to="/account" className="account-chip" title={`${user.email} · ${PLANS[plan].name}`} aria-label={`Account: ${user.email}, ${PLANS[plan].name} plan`}>
        <span className="account-avatar" aria-hidden="true">{initial}</span>
        <span className="account-plan">{PLANS[plan].name}</span>
      </Link>
    );
  }
  return <Link to="/login" className="ghost-button compact"><UserRound size={15} />Sign in</Link>;
}

function currentResolved() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function AppShell() {
  useSystemThemeSync();
  const [resolved, setResolved] = useState(currentResolved());
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  function toggleTheme() {
    const next = currentResolved() === 'dark' ? 'light' : 'dark';
    setThemePreference(next);
    applyTheme(next);
    setResolved(next);
  }

  return (
    <div className="app-shell">
      <Seo />
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
          <AccountControl />
          <button type="button" className="icon-button" onClick={toggleTheme} aria-label="Toggle color theme" title="Toggle theme">
            {resolved === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <Link to="/settings" className="icon-button link-button" aria-label="Settings" title="Settings"><Settings size={17} /></Link>
          <Link to="/new" className="primary-button compact"><Plus size={16} />New card</Link>
        </div>
      </header>
      <Suspense fallback={<div className="route-pending" aria-busy="true" />}>
        <Outlet />
      </Suspense>
    </div>
  );
}

// Keep the initial paint in sync if this module loads before main applies theme.
applyTheme(getThemePreference());
