# Security

## Reporting

Open a private security advisory on GitHub or contact the repository owner directly.

## Secrets

Do not commit `.env` files or service credentials. Runtime secrets for future server-side integrations must stay server-side.

## Optional Services

Supabase sync, analytics, and LLM helpers are feature-flagged and disabled by default. When enabled, review provider privacy terms and key exposure before deployment.
