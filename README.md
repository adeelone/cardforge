# CardForge

CardForge is a calm, premium React design tool for creating, previewing, and exporting print-ready business cards.

It runs anonymous-first in the browser, saves designs locally, and exports PDF, PNG, SVG, vCard, QR, and `.cardforge.json` files without requiring an account.

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
- Zustand for editor state with immutable history snapshots.
- SVG primitives for the editor preview and SVG export.
- `pdf-lib` for vector PDF pages with bleed, trim box, and crop marks.
- IndexedDB through `idb-keyval` for local design storage.
- `qrcode`, `lz-string`, and a hand-rolled vCard 4.0 writer for sharing.

`pnpm` was requested, but it is not installed in this workspace. The project uses npm scripts with pinned lockfile support once dependencies are installed.

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

- Add custom font embedding and subsetting for PDF export.
- Add CSV batch export for teams.
- Add optional Supabase share-code minting and revocation.
- Add NFC writer companion and wallet pass export.
- Add WebXR preview and an embeddable public-card iframe.
