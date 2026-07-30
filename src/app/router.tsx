import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './shell';
import { LandingRoute } from '../routes/landing';
import { EditorRoute } from '../routes/editor';
import { TemplatesRoute } from '../routes/templates';
import { LibraryRoute } from '../routes/library';
import { PublicCardRoute } from '../routes/public-card';
import { SettingsRoute } from '../routes/settings';

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

export const router = createBrowserRouter(
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
        { path: 'c/:slug', element: <PublicCardRoute /> },
        { path: '*', element: <Navigate to="/" replace /> }
      ]
    }
  ],
  { basename }
);
