# Professional Deployment

CardForge is a static Vite application. The local-first feature set needs no database or server. CardForge Cloud (accounts, sync, hosted cards, plans) adds a Supabase project; follow [CLOUD.md](CLOUD.md) for schema, auth email, and redirect-URL setup.

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
5. Vercel builds automatically use the hosted CardForge Cloud project and the production domain as the canonical origin (`vite.config.ts`). Override with `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, or `VITE_SITE_ORIGIN` in Project Settings if needed.
6. Add the production domain in Project Settings > Domains.
7. Create the DNS records Vercel displays at the domain registrar.
8. Enable deployment protection for previews if rosters or realistic contact data will be used in testing.
9. Require the GitHub CI and E2E checks before merging to `main`.
10. Enable the provider firewall/WAF, restrict public methods to static reads, and alert on deployment or domain changes as described in `PRODUCTION_SECURITY.md`.

`vercel.json` provides dynamic card-route rewrites, real 404 handling through the generated static output, and production security headers.

## Netlify

1. Import the GitHub repository.
2. Build command: `npm run build`.
3. Publish directory: `dist`.
4. Add the custom domain and apply the DNS records Netlify provides.
5. Enable branch deploy protection for non-public test data.

`netlify.toml` provides dynamic card-route rewrites, real 404 handling through the generated static output, and production security headers.

## Cloudflare or Edge Firewall

Place a custom production domain behind a managed edge only when the selected host supports that topology. Enable managed DDoS/WAF rules, block secret/source paths, allow only static read methods, protect previews, and keep DNS/registrar MFA enabled. The full rule baseline is in `PRODUCTION_SECURITY.md`.

GitHub Pages remains the public demo but cannot accept repository-defined WAF rules or all desired response headers.

## Docker / Private Hosting

```bash
docker build -t cardforge:0.5.0 .
docker run --rm -p 8080:80 cardforge:0.5.0
```

Terminate TLS at a managed load balancer or reverse proxy. The bundled nginx server handles SPA fallback, immutable asset caching, and security headers.

## Custom Domain Checklist

- Use a short product domain owned by the deploying organization.
- Redirect the alternate hostname (`www` or apex) to one canonical hostname.
- Keep HTTPS enforcement enabled.
- Verify `/`, `/new`, `/templates`, `/organizations`, `/trust`, and a generated `/c/...` link.
- Set `VITE_SITE_ORIGIN` to the final canonical base URL; the production build updates canonical/Open Graph URLs, `sitemap.xml`, `robots.txt`, `llms.txt`, and `security.txt`.
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

The app has no third-party analytics. Use host-level uptime and deployment monitoring, and Supabase's logs and Security Advisor for the cloud layer, without adding session replay or personal-data analytics.

- Keep the previous successful deployment available for instant rollback.
- Treat a failed CI, E2E, or dependency review as a release blocker.
- Test restored JSON backups before relying on them for a cohort or team.
- Document the owner of the domain, GitHub repository, hosting project, and print approval.

## Enterprise Boundary

CardForge Cloud provides personal accounts, sync, and revocable hosted links. SSO, role-based team access, organization-wide brand locking, approval workflows, audit logs, and cloud roster storage still require additional backend work, data-processing terms, a retention policy, and operational monitoring.
