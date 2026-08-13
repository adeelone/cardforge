# Privacy

CardForge is local-first.

- Designs are stored in IndexedDB.
- Settings are stored in localStorage.
- Uploaded images remain client-side. The current runtime has no sync service.
- The default app sends no telemetry.
- New shareable links contain compressed, field-filtered design state in the URL fragment. Fragments are not sent to the host in HTTP requests. They are encoded, not encrypted.
- Legacy query-string links remain readable and may have been recorded in browser history or hosting logs.
- Images and addresses are excluded from new share links by default.
- Optional link expiry is checked in the browser and is not remote revocation.

The site host still receives ordinary request metadata such as IP address, path, timestamp, and browser information. CardForge sets no analytics or advertising cookies.

Use Settings > Delete all local data to remove CardForge's designs, preferences, caches, and service-worker registration. The control does not delete files already exported or links already sent.

CardForge is not represented as FERPA, COPPA, HIPAA, or records-retention compliant. Organizations must obtain appropriate authorization and should not enter regulated or highly sensitive records.

The in-app Privacy and Trust Center pages are the plain-language product notices. This repository file documents the same technical behavior for maintainers.
