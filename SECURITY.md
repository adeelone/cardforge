# Security

## Reporting

Open a private security advisory on GitHub or contact the repository owner directly.

## Secrets

Do not commit `.env` files or service credentials. Runtime secrets for future server-side integrations must stay server-side.

## Current Runtime

CardForge is currently local-first and static. It does not call Supabase, analytics, LLM, or other provider APIs in the default runtime.

Uploaded images and saved designs stay in the browser unless the user exports a file or creates a share URL. Share URLs intentionally include encoded design data in the URL.

## Implemented Controls

- Share and import payload length caps before decompression or parsing.
- Structural design validation and bounded contact, element, variant, and asset collections.
- PNG, JPEG, and WEBP-only uploads with file-size and decoded-dimension limits.
- Unsafe imported assets and their image elements are removed before rendering.
- Public links allow only validated web, email, and telephone protocols.
- Per-field share controls, image exclusion by default, optional expiry, and optional vCard download.
- CSP and defense-in-depth response headers for Vercel, Netlify, and nginx deployments.
- A meta CSP for GitHub Pages, which cannot set repository-defined HTTP response headers.

## Security Boundaries

- Share payloads are encoded and compressed, not encrypted. Treat a shared URL as public to anyone who receives it.
- Client-side expiry is a display control, not remote revocation. It cannot erase downloads, screenshots, logs, browser history, or forwarded copies.
- GitHub Pages cannot provide the full response-header policy configured for Vercel, Netlify, and nginx.
- CardForge does not perform malware scanning or content moderation on exported files.
- Custom QR codes must be scanned at final print size; correction settings reduce but do not remove scan risk.

## Dependency and Release Checks

CI runs lint, TypeScript, unit/component tests, and a production build. Dependabot tracks npm and GitHub Actions updates. Run `npm audit --audit-level=high` before releases.

## Optional Services

Before adding sync, analytics, AI helpers, or hosted short links, review provider privacy terms, key exposure, CSP changes, and data-retention behavior.
