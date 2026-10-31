import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './shell';
import { LandingRoute } from '../routes/landing';
import { EditorRoute } from '../routes/editor';
import { TemplatesRoute } from '../routes/templates';
import { LibraryRoute } from '../routes/library';
import { PublicCardRoute } from '../routes/public-card';
import { NotFoundRoute } from '../routes/not-found';
import {
  SettingsRoute,
  TrustRoute,
  OrganizationsRoute,
  SharingRoute,
  PrivacyRoute,
  TermsRoute,
  AccessibilityRoute,
  HelpRoute,
  PricingRoute,
  LoginRoute,
  AccountRoute,
  CheckoutRoute,
  BlogIndexRoute,
  BlogPostRoute
} from './lazy-routes';


const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

// Core creation and sharing routes ship in the main bundle; account, billing,
// and informational pages load on demand inside the shell's Suspense boundary.
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
          { path: 'c/:slug', element: <PublicCardRoute /> },
          { path: 'blog', element: <BlogIndexRoute /> },
          { path: 'blog/:slug', element: <BlogPostRoute /> },
          { path: 'settings', element: <SettingsRoute /> },
          { path: 'trust', element: <TrustRoute /> },
          { path: 'organizations', element: <OrganizationsRoute /> },
          { path: 'sharing', element: <SharingRoute /> },
          { path: 'privacy', element: <PrivacyRoute /> },
          { path: 'terms', element: <TermsRoute /> },
          { path: 'accessibility', element: <AccessibilityRoute /> },
          { path: 'help', element: <HelpRoute /> },
          { path: 'pricing', element: <PricingRoute /> },
          { path: 'login', element: <LoginRoute /> },
          { path: 'account', element: <AccountRoute /> },
          { path: 'checkout/:plan', element: <CheckoutRoute /> },
          { path: '*', element: <NotFoundRoute /> }
        ]
      }
    ],
    { basename }
  );
}
