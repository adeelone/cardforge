# Production Security Baseline

## Hosting

GitHub Pages is the public demo. A school or business deployment should use Vercel, Netlify, Cloudflare, or a managed reverse proxy so response headers, firewall rules, rate limits, access controls, and logs can be configured by the operator.

Minimum controls:

- HTTPS only, canonical host redirect, HSTS after HTTPS is confirmed, and registrar MFA/transfer lock.
- Production deploys from `main` only after CI, E2E, and security checks pass.
- Separate owner and deployer roles, hardware-backed MFA where available, no shared administrator accounts, and quarterly access review.
- CSP, frame denial, MIME sniffing prevention, no-referrer, restrictive Permissions Policy, and immutable hashed assets.
- `index.html` revalidated and `sw.js` served with no-store so releases cannot remain pinned behind a stale worker.
- Provider access logs retained only as long as operationally necessary and never populated with realistic roster data during preview testing.

## Firewall and WAF

CardForge has no public API, login, upload endpoint, or origin server in the static edition. A firewall therefore protects hosting availability and deployment access; it does not make share URLs encrypted or revocable.

For a managed production host:

1. Enable provider DDoS protection and managed WAF rules.
2. Allow only `GET`, `HEAD`, and `OPTIONS` at the public application edge.
3. Block requests for dotfiles except `/.well-known/security.txt`.
4. Block common secret and source paths such as `/.git`, `/.env`, `/node_modules`, source maps if not intentionally published, and archive backups.
5. Rate-limit abnormal request floods while exempting ordinary static assets.
6. Restrict preview deployments to authenticated staff when realistic contact data is used.
7. Alert on deployment changes, domain/DNS changes, WAF rule changes, and unusual 4xx/5xx rates.

Do not advertise a WAF as complete application security. Browser-side import validation, dependency hygiene, repository controls, and operator data minimization remain necessary.

## Secrets

CardForge reads no environment variables in release 0.3.1. Never place secrets in `VITE_*` variables because Vite embeds them in public browser code. Future server credentials belong in a server-side secret store with least privilege and rotation.

## Release and Recovery

- Keep the previous known-good deployment available for rollback.
- Verify the commit SHA, workflow conclusions, live HTML asset hashes, worker version, and security contact after every production release.
- Follow `INCIDENT_RESPONSE.md` for suspected compromise and `THREAT_MODEL.md` when the architecture changes.
