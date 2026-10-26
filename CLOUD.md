# CardForge Cloud

CardForge Cloud is the optional hosted layer on top of the local-first editor: accounts, cross-device sync, hosted digital cards with short revocable links, privacy-respecting view analytics, and Free / Pro / Business plans. The editor, every export, and fragment share links keep working with no account and no backend.

## Architecture

```
Browser (Vite SPA)                          Supabase
├─ IndexedDB  ← always the first write      ├─ Auth (email + password, magic link, reset)
├─ src/lib/cloud/client.ts  (lazy SDK)  ──► ├─ Postgres + row-level security
├─ src/lib/cloud/session.ts (auth, plan)    │   profiles · subscriptions · billing_events
├─ src/lib/cloud/sync.ts    (reconcile)     │   designs · published_cards · card_view_days
└─ src/lib/cloud/api.ts     (RPC wrappers)  └─ SECURITY DEFINER functions (all plan rules)
```

- **The database is the source of truth for entitlements.** `plan_limits()` defines quotas; triggers and functions enforce them. `src/lib/plans.ts` mirrors the numbers for display only.
- **Writes that cross a plan boundary go through functions**: `save_design`, `publish_card`, `set_card_active`, `demo_checkout`, `set_subscription_cancel`, `delete_my_account`. Direct `INSERT/UPDATE` on `published_cards`, `subscriptions`, and `billing_events` is revoked.
- **Anonymous visitors can call exactly one function**: `get_public_card(slug)`. Every table denies the `anon` role.
- **The SDK is lazy-loaded.** It is fetched only for a stored session, an auth redirect, or a cloud page (sign-in, account, hosted card), so the main bundle stays around 35 kB gzip.

### Sync model

1. Every edit saves to IndexedDB first (700 ms debounce).
2. When signed in, the edited design is pushed with `save_design` (2.5 s debounce). The function only overwrites a cloud row if the incoming `client_updated_at` is newer, so a stale tab can't clobber another device.
3. Opening **My cards** reconciles both ways (`planSync` in `sync.ts`): newer or missing cloud copies are pulled, newer local copies of synced designs are pushed. Local-only designs stay local until edited while signed in or uploaded with the cloud button.
4. Hitting the sync quota never loses work. The card stays on the device, is marked "This device", and the user sees one upgrade notice.

### Hosted cards

- `publish_card` stores the share-filtered copy (`sanitizeSharedDesign`), so only the fields enabled under **Privacy & sharing** are published. It assigns a random 8-character slug, or a custom slug on Pro and Business.
- `/c/:slug` with no `#d=` fragment resolves through `get_public_card`, and the payload is re-validated with `normalizeDesign` like any import.
- Switching a card off or letting it expire makes the link show "no longer available". Once a card is published, its QR codes encode the short link.
- Views are aggregated per card per day. No IP address, user agent, cookie, or referrer is stored, and the owner's own views are not counted.

### Plans

|                      | Free | Pro ($9/mo) | Business ($29/mo) |
| -------------------- | ---- | ----------- | ----------------- |
| Synced cards         | 3    | 50          | 500               |
| Live hosted cards    | 1    | 10          | 100               |
| Custom slugs         | —    | ✓           | ✓                 |
| Daily view analytics | —    | ✓           | ✓                 |
| No CardForge badge   | —    | ✓           | ✓                 |

Downgrades never delete data. Existing cards keep working; new ones are blocked until usage is under the limit.

## Setup

1. Create a Supabase project.
2. Apply `supabase/migrations/20261026000000_cardforge_cloud.sql`, either from the SQL editor or with `supabase db push`.
3. **Authentication → Sign In / Providers → Email**: either configure custom SMTP (Resend, Postmark, SES, …) or turn off **Confirm email**. Supabase's built-in mailer only delivers to your own team's addresses and is heavily rate-limited, so public sign-ups need one of the two.
4. **Authentication → URL Configuration**: set **Site URL** to the production origin and add `https://<your-domain>/**` (and preview domains, if used) to **Redirect URLs**, so magic-link, confirmation, and password-reset emails return to the app.
5. Provide `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the build (see `.env.example`). Vercel builds of this repository default to the hosted CardForge project.
6. Run the Supabase **Security Advisor** after any schema change.

The CSP in `vercel.json`, `netlify.toml`, `nginx.conf`, `public/_headers`, and `index.html` allows `connect-src https://*.supabase.co`.

## Moving from demo billing to Stripe

The checkout is a clearly labeled demo: it collects no payment details and activates the plan directly through `demo_checkout`. To take real payments:

1. Create Stripe Products and Prices for Pro and Business.
2. Add a Supabase Edge Function that creates a Checkout Session (with the user's id in `client_reference_id`) and returns its URL. Point `/checkout/:plan` at it instead of `demoCheckout`.
3. Add a webhook Edge Function, using the service role and verifying the Stripe signature, that upserts `subscriptions` (`provider = 'stripe'`, period dates, `cancel_at_period_end`) and inserts `billing_events` on `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`.
4. Change `demo_billing_enabled()` to return `false`. The demo functions then refuse to run, and the UI stops showing the demo notice.
5. Replace cancel/resume with a Stripe Customer Portal link, and update the privacy notice and terms before launch.

## Operations

- **Backups**: daily backups are included on paid Supabase plans. On the free plan, schedule `pg_dump` or export from the dashboard.
- **Free-tier pausing**: free Supabase projects pause after a week of inactivity. Upgrade the project before relying on it in production.
- **Abuse**: hosted payloads are capped at 1 MB and designs at 3 MB. Live-card counts are limited per plan. To take down a hosted card, set `is_active = false` on that `published_cards` row.
- **Account erasure**: `delete_my_account()` removes the auth user, and cascades remove every row they own.
