# Architecture

## Data Model

The editor works from a single normalized `Design` document:

- `meta`: id, slug, timestamps, template id.
- `identity`: name, title, company, department, pronouns, tagline.
- `contacts`: typed rows capped by the UI.
- `card`: size preset, bleed, safe area, finish, density.
- `theme`: color and typography tokens.
- `elements`: stable front/back SVG element records.
- `variants`: saved identity/contact combinations.
- `assets`: uploaded images as data URLs.
- `qrStyle`: module shape, foreground/background, quiet zone, correction level, and optional center mark.
- `share`: field-level inclusion, image inclusion, vCard permission, and optional expiry.

## State

`src/editor/state/store.ts` owns the active design with Zustand. Edits are pure updates that push full design snapshots into a bounded history stack. Undo and redo operate only on the design document; transient selection state stays outside history.

## Rendering

`CardSvg` renders the editable preview as SVG. Template element text is interpolated from the design document, which keeps template switching content-preserving. The same SVG renderer is reused by SVG and PNG export.

## Export Pipeline

- PDF: `pdf-lib` creates one page for front and one page for back, includes bleed, trim box, and crop marks.
- PNG: renders the SVG preview to a canvas at 300 or 600 DPI.
- SVG: serializes front and back into one SVG bundle.
- vCard: emits vCard 4.0 with typed phone, email, URL, and address rows.
- QR: encodes vCard, current URL, or the public digital-card URL.
- Roster PDF: applies each local CSV variant to one approved layout and emits front/back pages per person.

## Trust Boundary

Imported JSON and compressed share payloads pass through `normalizeDesign` before storage or rendering. Collections and strings are bounded; active SVG assets are discarded; public contact links are protocol-checked. Shared designs are filtered by the design's share preferences and never include local roster variants.

## Organization Workflow

Roster CSV parsing runs locally and is capped at 250 people. It creates `DesignVariant` records without uploading the source file. The static edition deliberately has no central account, approval, or organization database.

## Worker Boundary

Palette extraction, raster work, and optional background removal have worker entrypoints. The default build keeps background removal disabled because the model payload is large.

## PWA

The production build registers `public/sw.js` with cache bypass for worker updates. Navigation is network-first with an offline shell fallback; fingerprinted assets are cache-first. Activation removes only older `cardforge-*` caches and claims open clients. IndexedDB keeps designs available offline.

## Share Transport

New public-card payloads are stored after `#d=` in the URL fragment. Fragments remain browser-side and are not part of the HTTP request or ordinary host access log. The decoder retains legacy `?d=` support so previously issued links continue to work.
