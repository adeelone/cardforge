# Changelog

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
