# Security

## Reporting

Open a private security advisory on GitHub or contact the repository owner directly.

## Secrets

Do not commit `.env` files or service credentials. Runtime secrets for future server-side integrations must stay server-side.

## Current Runtime

CardForge is currently local-first and static. It does not call Supabase, analytics, LLM, or other provider APIs in the default runtime.

Uploaded images and saved designs stay in the browser unless the user exports a file or creates a share URL. Share URLs intentionally include encoded design data in the URL.

## Optional Services

Before adding sync, analytics, AI helpers, or hosted short links, review provider privacy terms, key exposure, CSP changes, and data-retention behavior.
