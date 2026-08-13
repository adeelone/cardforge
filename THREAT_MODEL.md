# CardForge Threat Model

Reviewed: 2026-08-12

## Protected Assets

- Names, contact details, photos, logos, rosters, and card designs entered by users.
- Integrity of generated PDFs, images, vCards, QR codes, JSON backups, and public cards.
- Availability and integrity of the public build, repository, release workflow, and domain.

## Trust Boundaries

1. Browser storage is controlled by the user, browser profile, device, and extensions.
2. Imported JSON, CSV, raster images, and compressed share payloads are untrusted input.
3. Exported files and share URLs leave CardForge's control when the user saves or sends them.
4. GitHub and the production host are supply-chain and availability dependencies.
5. A future API, account system, analytics service, or hosted link service would create a new server-side trust boundary and requires a separate review.

## Primary Threats and Controls

| Threat | Current controls | Residual risk |
| --- | --- | --- |
| Malicious imported design | Size and collection caps, structural normalization, raster-only assets, active SVG removal, protocol allowlist | Complex image decoders and browser defects remain platform risks |
| Share-link data disclosure | Field-level selection, images and address off by default, roster removal, fragment payload, optional expiry | Recipients can inspect, forward, screenshot, or save the encoded data |
| Script injection | React escaping, no HTML injection APIs, restrictive CSP, no remote scripts, protocol validation | Browser extensions and compromised hosting/repository accounts remain outside app control |
| Stale or compromised release | Network-first navigation, versioned assets, worker update checks, CI, E2E, CodeQL, protected-branch rules | Repository administrators can bypass rules; GitHub Pages has no custom WAF policy |
| Cross-site framing or capability abuse | Frame denial on supported hosts, object/frame/form blocking, restrictive Permissions Policy | GitHub Pages can enforce only the meta-CSP subset plus platform headers |
| Roster exposure | Local parsing, 500 KB/250-row limits, no roster in share links, local multi-card export | Operators can still import excessive or unauthorized personal data and mishandle exports |
| Data loss | JSON export, local library, deletion controls, documented backups | Browser storage is not durable backup and has no cross-device recovery |
| QR redirection abuse | Safe contact protocols, user-visible fields, final-size scan guidance | A user can intentionally enter an unsafe destination in printable text or misuse a valid URL |

## Explicit Non-Goals

- CardForge is not an identity provider, credential issuer, secret manager, student-information system, health-record system, or payment processor.
- Encoded share links are not encrypted or remotely revocable.
- The static edition does not provide tenant isolation, centralized authorization, SSO, audit logs, malware scanning, DLP, or regulatory certification.

Review this file when changing data flows, adding a dependency that executes in the browser, accepting a new file type, introducing a backend, or changing deployment ownership.
