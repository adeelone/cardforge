import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { createAppRouter } from './app/router';
import { ErrorBoundary } from './app/error-boundary';
import { Toaster } from './app/toaster';
import { UpdateBanner } from './app/update-banner';
import { applyTheme } from './app/theme';
import { APP_RELEASE } from './app/release';
import { useUpdateStore } from './lib/update-available';
import { bootSession } from './lib/cloud/session';
import './styles/fonts.css';
import './styles/base.css';
import './styles/cloud.css';

// Apply the saved theme before first paint to avoid a flash.
applyTheme();

const redirect = new URLSearchParams(window.location.search).get('redirect');
if (redirect) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const next = redirect.startsWith(base) ? redirect.slice(base.length) || '/' : redirect;
  window.history.replaceState(null, '', `${base}${next}`);
}

bootSession();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <RouterProvider router={createAppRouter()} />
      <Toaster />
      <UpdateBanner />
    </ErrorBoundary>
  </React.StrictMode>
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  const hadController = Boolean(navigator.serviceWorker.controller);
  let handled = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // A new service worker can take control of this tab at any moment. Don't
    // force a reload out from under an active edit — that would silently
    // wipe the in-memory undo stack. Surface a banner and let the user
    // choose when (see app/update-banner.tsx).
    if (!hadController || handled || sessionStorage.getItem('cardforge:release') === APP_RELEASE) return;
    handled = true;
    sessionStorage.setItem('cardforge:release', APP_RELEASE);
    useUpdateStore.getState().markAvailable();
  });

  void navigator.serviceWorker
    .register(`${import.meta.env.BASE_URL}sw.js?v=${APP_RELEASE}`, { updateViaCache: 'none' })
    .then((registration) => registration.update())
    .catch(() => undefined);
}
