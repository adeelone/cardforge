# CardForge Production Audit

Date: 2026-07-30
Repo: `adeelone/cardforge`
Branch: `main`

## Current Status

CardForge is a client-only Vite/React application for creating, previewing, saving, sharing, and exporting business card designs. The default product path does not require a backend, database, API key, or paid external service.

The application is deployable as static assets from `dist/`. GitHub Pages, Vercel, Netlify, Docker, and nginx deployment files are present.

## Functional Inventory

- Editor route with identity, contacts, template, layout, layers, typography, color, variant, save, and export controls.
- Template gallery and template switching.
- Local library backed by IndexedDB.
- Share-link route using encoded design payloads.
- Public card route for encoded shared cards.
- Static landing, settings, and fallback routing.
- Export support for PDF, PNG, SVG, vCard, QR SVG, and JSON.
- PWA manifest and service worker for same-origin static asset caching.

## Environment Variables

No environment variables are required for the default app.

Optional deployment-specific values may be configured in the host dashboard, but CardForge does not depend on runtime secrets.

## Deployment Files

- GitHub Pages workflow: `.github/workflows/pages.yml`
- Vercel: `vercel.json`
- Netlify: `netlify.toml`
- Docker: `Dockerfile`
- nginx: `nginx.conf`
- SPA fallbacks: `public/404.html`, `public/_redirects`

## Security Review

- No server-side API routes are present.
- No credential-bearing `.env` file is committed.
- Uploaded images remain inside the local design document unless the user exports or shares the document.
- Vercel, Netlify, and nginx deployments set CSP, content type, referrer, permissions, and HTTPS security headers.
- GitHub Pages cannot emit custom security headers; use Vercel/Netlify/nginx if response-header hardening is mandatory.
- The app stores designs locally in IndexedDB. Shared URLs intentionally include encoded design data in the URL.

## Production Notes

- The service worker and manifest use base-relative URLs so the PWA works under GitHub Pages subpaths such as `/cardforge/`.
- Export and QR dependencies are lazy-loaded from user actions to reduce the initial editor bundle.
- The app is static-first; durable multi-device sync, accounts, team sharing, analytics, and payment workflows are intentionally not part of the default deployment.

## Validation Checklist

Run before release:

```bash
npm ci
npm audit --audit-level=high
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e -- --project=chromium
```

After deployment, verify:

- Root page returns HTTP 200.
- `/new` loads through SPA fallback.
- Editor canvas renders front/back card faces.
- Export buttons generate files.
- Share URL route renders a public card.
