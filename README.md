# CardForge

CardForge is a local-first React studio for designing, previewing, and exporting **print-ready and digital business cards** — from buttoned-up professional layouts to bold gradient/neon/oversized-type cards.

It runs anonymous-first in the browser, saves designs locally, and exports PDF (with bleed + crop marks), PNG, SVG, vCard, QR, and `.cardforge.json` files without requiring an account.

## Highlights

- **Freeform editor** — add, delete, duplicate, drag, resize, rotate, layer, align, and lock text, shapes, images, and QR codes. Whole drags are a single undo step.
- **Real typography** — 10 self-hosted typefaces (via `@fontsource`) with curated heading/body pairings, so every template renders in its true typeface, online or offline.
- **True card geometry** — the canvas tracks each preset's real aspect ratio (US, EU, JP, UK, square, mini; landscape/portrait) instead of forcing everything into a landscape box.
- **Digital cards** — share a link or QR that opens a tappable digital card and saves the recipient's contact. The link is serverless (the design travels in the URL) and survives `URLSearchParams` round-trips.
- **Resilient QR** — QR content degrades gracefully (full link → link without heavy image assets → vCard → short link) so a scannable code always renders.
- **Working dark mode** and mm/inch units, applied app-wide.
- **Accessibility** — WCAG AA contrast check on card colors, focus-visible outlines, keyboard nudging/delete/duplicate/undo.

## Keyboard shortcuts (editor)

- Arrow keys nudge selection (Shift = 8px steps)
- `Ctrl/Cmd+D` duplicate · `Delete`/`Backspace` remove · `Esc` deselect
- `Ctrl/Cmd+Z` undo · `Ctrl/Cmd+Shift+Z` (or `Ctrl+Y`) redo

## Quickstart

```bash
npm install
npm run dev
```

Open the local URL printed by Vite and start from `/new`.

For CI or production installs, use:

```bash
npm ci
npm run build
```

## Stack

- Vite, React 19, and TypeScript strict for the app shell.
- React Router for routes.
- Zustand for editor state with immutable history snapshots and single-undo drag transforms.
- SVG primitives shared by the on-canvas editor and the SVG/PNG exporters (one rendering source of truth).
- `pdf-lib` for vector PDF pages with bleed, trim box, and crop marks.
- `@fontsource` self-hosted fonts (no CDN, CSP-safe, offline).
- IndexedDB through `idb-keyval` for local design storage.
- `qrcode`, `lz-string`, and a hand-rolled vCard 4.0 writer for sharing.

## Environment

Copy `.env.example` to `.env.local` when enabling optional features.

- `VITE_ENABLE_LLM=false` keeps all LLM helpers disabled.
- `VITE_LLM_PROVIDER=mock` is the default provider abstraction.
- `VITE_ENABLE_SYNC=false` keeps Supabase sync out of the runtime path.
- `VITE_ENABLE_ANALYTICS=false` disables analytics.

## Feature Flags

Optional sync, LLM copy helpers, analytics, and background removal are intentionally off by default. No network calls are made by those features when disabled.

## Assumptions

- The first version prioritizes a complete local editor and export path over accounts or hosted short links.
- True CMYK conversion is documented as an external print-production step rather than bundled into the app.
- PDF text is vector text with standard embedded PDF fonts in v0.1; custom font subsetting is a follow-up.
- QR code rendering in the SVG preview is generated client-side.

## Deploy

### Vercel

Import the GitHub repository. `vercel.json` sets the Vite build command, `dist` output directory, and SPA route rewrites.

### Netlify

`netlify.toml` sets build command `npm run build`, publish directory `dist`, and SPA fallback redirects.

### GitHub Pages

The `Pages` GitHub Actions workflow builds with `GITHUB_PAGES=true`, sets the Vite base path to `/cardforge/`, uploads `dist`, and deploys to GitHub Pages.

### Docker

```bash
docker build -t cardforge .
docker run --rm -p 8080:80 cardforge
```

The bundled nginx config serves static assets with cache headers and falls back to `index.html` for client-side routes.

## Development

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Next Steps

- Embed/subset the self-hosted fonts into PDF export (PDF currently uses standard Helvetica; the canvas, PNG, and SVG use the true typefaces).
- Add CSV batch export for teams.
- Add optional hosted short links so image-heavy digital cards aren't limited by URL length.
- Add NFC writer companion and wallet pass export.
