import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { createAppRouter } from './app/router';
import { ErrorBoundary } from './app/error-boundary';
import { Toaster } from './app/toaster';
import { applyTheme } from './app/theme';
import './styles/fonts.css';
import './styles/base.css';

// Apply the saved theme before first paint to avoid a flash.
applyTheme();

const redirect = new URLSearchParams(window.location.search).get('redirect');
if (redirect) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const next = redirect.startsWith(base) ? redirect.slice(base.length) || '/' : redirect;
  window.history.replaceState(null, '', `${base}${next}`);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <RouterProvider router={createAppRouter()} />
      <Toaster />
    </ErrorBoundary>
  </React.StrictMode>
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined);
}
