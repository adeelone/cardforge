import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './shell';
import { LandingRoute } from '../routes/landing';
import { EditorRoute } from '../routes/editor';
import { TemplatesRoute } from '../routes/templates';
import { LibraryRoute } from '../routes/library';
import { PublicCardRoute } from '../routes/public-card';
import { SettingsRoute } from '../routes/settings';
import { TrustRoute } from '../routes/trust';
import { SharingRoute } from '../routes/sharing';
import { AccessibilityRoute, HelpRoute, PrivacyRoute, TermsRoute } from '../routes/info-pages';
import { OrganizationsRoute } from '../routes/organizations';

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

export function createAppRouter() {
  return createBrowserRouter(
    [
      {
        path: '/',
        element: <AppShell />,
        children: [
          { index: true, element: <LandingRoute /> },
          { path: 'new', element: <EditorRoute mode="new" /> },
          { path: 'design/:id', element: <EditorRoute mode="existing" /> },
          { path: 'templates', element: <TemplatesRoute /> },
          { path: 'library', element: <LibraryRoute /> },
          { path: 'settings', element: <SettingsRoute /> },
          { path: 'trust', element: <TrustRoute /> },
          { path: 'organizations', element: <OrganizationsRoute /> },
          { path: 'sharing', element: <SharingRoute /> },
          { path: 'privacy', element: <PrivacyRoute /> },
          { path: 'terms', element: <TermsRoute /> },
          { path: 'accessibility', element: <AccessibilityRoute /> },
          { path: 'help', element: <HelpRoute /> },
          { path: 'c/:slug', element: <PublicCardRoute /> },
          { path: '*', element: <Navigate to="/" replace /> }
        ]
      }
    ],
    { basename }
  );
}
