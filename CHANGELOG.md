# Changelog

## 0.3.1 - Fresh-release and security hardening

### Fixed
- Replaced cache-first page navigation with network-first navigation and automatic service-worker update checks so returning visitors receive the current interface.
- Scoped cache cleanup and local-data deletion to CardForge instead of other applications on the same origin.
- Corrected GitHub Pages icon, manifest, and Open Graph paths for the `/cardforge/` deployment base.

### Privacy and security
- Moved new digital-card payloads from query strings to URL fragments while retaining legacy-link compatibility.
- Added deep nested import normalization, bounded geometry, stricter CSP and permissions policies, release-safe cache headers, CI dependency auditing, and least-privilege workflow permissions.
- Added a threat model, production firewall/WAF baseline, incident-response procedure, and expanded privacy, terms, accessibility, and school-use notices.

## 0.3.0 - Professional pilot edition

### Added
- Six additional templates for students, professionals, creatives, and small businesses, bringing the built-in collection to 16.
- Searchable template and local card libraries, customizable QR patterns, privacy-aware share links, and standalone QR SVG export.
- CSV roster import and export, reusable team variants, and multi-person roster PDF generation for schools and organizations.
- Organization, trust, sharing, privacy, terms, accessibility, and help pages.
- Deployment, organization-pilot, security-reporting, and operational documentation.
- CodeQL, dependency review, and expanded desktop/mobile end-to-end coverage.

### Changed
- Reworked the editor into a larger proofing workspace with a focused tool rail and roomier inspector.
- Refined the visual system with warmer language, restrained surfaces, and responsive layouts for professional presentations.
- Share links now expose only explicitly selected fields and never include the full roster.

### Security
- Added strict design normalization, payload and upload limits, unsafe URL filtering, raster-only image uploads, and share expiry support.
- Added restrictive browser security headers for Vercel, Netlify, and nginx deployments.
- Added a security contact file and documented the static edition's privacy and trust boundaries.

## 0.2.0 — Studio revamp

### Added
- Freeform editor: add / delete / duplicate text, shapes, images, and QR codes.
- On-canvas resize handles, rotate handle, and multi-select drag; a whole drag is one undo step.
- Real self-hosted typography (10 typefaces via `@fontsource`) with grouped pickers and curated pairings.
- Shape variety: rectangle, ellipse, line, gradient fills, per-element opacity, corner radius, and stroke.
- Per-element controls: font, size, weight, alignment, color, z-order (front/back), lock, and opacity.
- Working dark mode and mm/inch units applied across the app.
- Toast notifications, an error boundary, and richer landing / templates / library / digital-card pages with live previews.
- New creative templates: Neon, Marquee, and Sunset (gradient + oversized display type).
- Keyboard shortcuts: nudge, duplicate, delete, deselect, undo/redo.

### Fixed
- **Share links were silently corrupted** — `+` in the compressed payload became a space via `URLSearchParams`. URLs are now percent-encoded and decoding is tolerant of the corruption.
- **Digital-card QR often failed to render** — the full-design payload overflowed QR capacity. QR now uses higher-capacity encoding with a graceful fallback chain (full link → link without image assets → vCard → short link).
- **Canvas ignored card aspect ratio** — square, portrait, and mini cards were forced into a landscape box; the canvas and all exporters now use the card's true geometry.
- SVG-export QR viewBox is derived from the generated code instead of a hardcoded size.
- Fonts are awaited before PNG rasterization so exported images use the real typefaces.

### Security
- Resolved all `npm audit` high-severity advisories (0 vulnerabilities).

## 0.1.0

- Initial CardForge editor, template, export, local library, and PWA scaffold.
