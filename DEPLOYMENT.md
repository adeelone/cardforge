# Professional Deployment

CardForge is a static Vite application. It does not need a runtime database, API key, or server process for its current local-first feature set.

## Recommended Production Shape

For a school, accelerator, or business pilot, use **Vercel or Netlify with a custom domain**. Both apply the repository's security headers. GitHub Pages remains useful for the public demo, but it cannot apply repository-defined HTTP response headers.

Recommended topology:

1. GitHub is the source of truth.
2. Pull requests run CI and browser tests.
3. The host builds with `npm ci && npm run build` and serves `dist`.
4. A custom HTTPS domain points to the host.
5. Production deploys only from `main` after checks pass.

## Vercel

1. Import `adeelone/cardforge` in Vercel.
2. Confirm Framework Preset: `Vite`.
3. Confirm Build Command: `npm run build`.
4. Confirm Output Directory: `dist`.
5. Leave environment variables empty; none are required.
6. Add the production domain in Project Settings > Domains.
7. Create the DNS records Vercel displays at the domain registrar.
8. Enable deployment protection for previews if rosters or realistic contact data will be used in testing.
9. Require the GitHub CI and E2E checks before merging to `main`.

`vercel.json` provides SPA rewrites and production security headers.

## Netlify

1. Import the GitHub repository.
2. Build command: `npm run build`.
3. Publish directory: `dist`.
4. Add the custom domain and apply the DNS records Netlify provides.
5. Enable branch deploy protection for non-public test data.

`netlify.toml` provides SPA routing and production security headers.

## Docker / Private Hosting

```bash
docker build -t cardforge:0.3.0 .
docker run --rm -p 8080:80 cardforge:0.3.0
```

Terminate TLS at a managed load balancer or reverse proxy. The bundled nginx server handles SPA fallback, immutable asset caching, and security headers.

## Custom Domain Checklist

- Use a short product domain owned by the deploying organization.
- Redirect the alternate hostname (`www` or apex) to one canonical hostname.
- Keep HTTPS enforcement enabled.
- Verify `/`, `/new`, `/templates`, `/organizations`, `/trust`, and a generated `/c/...` link.
- Update `public/sitemap.xml`, `public/robots.txt`, `public/.well-known/security.txt`, and Open Graph URLs when the canonical domain changes.
- Do not add a `CNAME` file until the actual domain is known.

## Release Verification

```bash
npm ci
npm audit --audit-level=high
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

After deployment:

1. Confirm the root returns HTTP 200 over HTTPS.
2. Open a deep link directly and confirm SPA recovery.
3. Create and save a card, then reload it from My cards.
4. Import the roster template and export a roster PDF.
5. Disable phone sharing, copy a link, and confirm the public card omits the phone.
6. Scan the printed-size QR on iOS and Android.
7. Confirm no unexpected console errors or cross-origin requests.
8. Inspect response headers on Vercel, Netlify, or nginx.

## Monitoring and Rollback

The current app intentionally has no analytics or hosted application backend. Use host-level uptime and deployment monitoring without adding session replay or personal-data analytics.

- Keep the previous successful deployment available for instant rollback.
- Treat a failed CI, E2E, or dependency review as a release blocker.
- Test restored JSON backups before relying on them for a cohort or team.
- Document the owner of the domain, GitHub repository, hosting project, and print approval.

## Enterprise Boundary

Centralized accounts, SSO, role-based access, organization-wide brand locking, approval workflows, revocable hosted links, audit logs, and cloud roster storage require a backend, authentication, data-processing terms, retention policy, and operational monitoring. They are not implied by the static edition.
