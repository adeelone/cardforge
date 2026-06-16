import { Outlet, NavLink } from 'react-router-dom';
import { CreditCard, FolderOpen, LayoutTemplate, Settings } from 'lucide-react';

const links = [
  { to: '/new', label: 'Editor', icon: CreditCard },
  { to: '/templates', label: 'Templates', icon: LayoutTemplate },
  { to: '/library', label: 'Library', icon: FolderOpen },
  { to: '/settings', label: 'Settings', icon: Settings }
];

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label="CardForge home">
          <span className="brand-mark">CF</span>
          <span>CardForge</span>
        </NavLink>
        <nav aria-label="Primary navigation">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink key={link.to} to={link.to} className="nav-link">
                <Icon aria-hidden="true" size={18} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
