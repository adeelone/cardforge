# CardForge Production Audit

Date: 2026-08-12
Repo: `adeelone/cardforge`
Branch: `main`

## Current Status

CardForge is a client-only Vite/React application for creating, previewing, saving, sharing, and exporting business card designs. The default product path does not require a backend, database, API key, account, or paid external service.

The application is deployable as static assets from `dist/`. GitHub Pages, Vercel, Netlify, Docker, and nginx deployment files are present.

## Functional Inventory

- Editor route with identity, contacts, template, layout, layers, typography, color, variant, save, and export controls.
- Template gallery and template switching.
- Local library backed by IndexedDB.
- Local CSV roster import/export, reusable variants, and multi-person print PDF export.
- Share-link route using encoded design payloads.
- Public card route for encoded shared cards.
- Static landing, settings, Trust Center, sharing guide, privacy, terms, accessibility, help, and fallback routing.
- Export support for PDF, PNG, SVG, vCard, QR SVG, and JSON.
- PWA manifest and service worker for same-origin static asset caching under both root and GitHub Pages subpath deployments.

## Environment Variables

No environment variables are required. `.env.example` is informational only; the current app does not read provider keys or make optional-service calls.

## Deployment Files

- GitHub Pages workflow: `.github/workflows/pages.yml`
- CodeQL and dependency review: `.github/workflows/security.yml`
- Vercel: `vercel.json`
- Netlify: `netlify.toml`
- Docker: `Dockerfile`
- nginx: `nginx.conf`
- SPA fallbacks: `public/404.html`, `public/_redirects`

## Security Review

- No server-side API routes are present.
- No credential-bearing `.env` file is committed.
- No third-party AI assistant project files are tracked.
- Uploaded images remain inside the local design document unless the user exports or shares the document.
- Vercel, Netlify, and nginx deployments set CSP, content type, referrer, permissions, and HTTPS security headers.
- GitHub Pages cannot emit custom security headers; use Vercel/Netlify/nginx if response-header hardening is mandatory.
- The app stores designs locally in IndexedDB. Shared URLs intentionally include encoded design data in the URL.
- Shared/imported payloads are bounded and validated; unsafe asset types and public contact protocols are rejected.
- Nested imported text, enum, and geometry fields are normalized and bounded before rendering.
- Share links use field-level privacy controls, exclude images and addresses by default, and may carry a client-enforced expiry.
- New share payloads use URL fragments so the hosting request does not carry card data; legacy query links remain supported.
- Vercel, Netlify, and nginx policies also deny objects and framing and set opener/resource isolation headers.

## Production Notes

- The service worker and manifest use base-relative URLs so the PWA works under GitHub Pages subpaths such as `/cardforge/`.
- Page navigation is network-first and the service worker is release-versioned, update-checked, and scoped to CardForge caches to prevent stale releases.
- GitHub Pages direct document requests for SPA deep links can return an initial 404; `public/404.html` redirects the browser back into the app route.
- Export and QR dependencies are lazy-loaded from user actions to reduce the initial editor bundle.
- The app is static-first; durable multi-device sync, accounts, team sharing, analytics, and payment workflows are not part of the current deployment.

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
- Disabled share fields do not appear in the decoded public payload.
- QR pattern, color, correction, and center-mark controls update the rendered code and SVG export.
- Trust, privacy, terms, accessibility, sharing, and help routes render without console errors.
