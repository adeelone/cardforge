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

## Worker Boundary

Palette extraction, raster work, and optional background removal have worker entrypoints. The default build keeps background removal disabled because the model payload is large.

## PWA

The production build registers `public/sw.js`, caching the editor shell and manifest. IndexedDB keeps designs available offline.
