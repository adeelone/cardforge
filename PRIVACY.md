# Privacy

CardForge is local-first.

- Designs are stored in IndexedDB.
- Settings are stored in localStorage.
- Uploaded images remain client-side. The current runtime has no sync service.
- The default app sends no telemetry.
- Shareable links contain compressed, field-filtered design state in the URL. They are encoded, not encrypted.
- Images and addresses are excluded from new share links by default.
- Optional link expiry is checked in the browser and is not remote revocation.

Use Settings > Delete all local data to clear browser-side settings and service worker caches. Browser dev tools can clear IndexedDB data if a hard reset is needed.

The in-app Privacy and Trust Center pages are the plain-language product notices. This repository file documents the same technical behavior for maintainers.
