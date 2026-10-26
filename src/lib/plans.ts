export type PlanTier = 'free' | 'pro' | 'business';

export interface PlanLimits {
  cloud_designs: number;
  live_cards: number;
  custom_slugs: boolean;
  analytics: boolean;
  remove_badge: boolean;
  price_cents: number;
}

export interface PlanInfo {
  tier: PlanTier;
  name: string;
  tagline: string;
  limits: PlanLimits;
  highlights: string[];
}

/**
 * Display copy for the pricing page. Entitlements are enforced by the
 * database (supabase/migrations: plan_limits), which is the source of truth;
 * keep these numbers in step with it.
 */
export const PLANS: Record<PlanTier, PlanInfo> = {
  free: {
    tier: 'free',
    name: 'Free',
    tagline: 'Everything you need to design and print.',
    limits: { cloud_designs: 3, live_cards: 1, custom_slugs: false, analytics: false, remove_badge: false, price_cents: 0 },
    highlights: [
      'Unlimited designs saved on this device',
      'Every export: PDF with bleed, PNG, SVG, vCard, QR',
      'Roster batch PDF for groups',
      '3 cards synced across devices',
      '1 live hosted card with a short link'
    ]
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    tagline: 'For people who hand out cards every week.',
    limits: { cloud_designs: 50, live_cards: 10, custom_slugs: true, analytics: true, remove_badge: true, price_cents: 900 },
    highlights: [
      'Everything in Free',
      '50 cards synced across devices',
      '10 live hosted cards',
      'Custom links like /c/your-name',
      '30-day view analytics',
      'No CardForge badge on your digital card'
    ]
  },
  business: {
    tier: 'business',
    name: 'Business',
    tagline: 'For studios, shops, and teams at scale.',
    limits: { cloud_designs: 500, live_cards: 100, custom_slugs: true, analytics: true, remove_badge: true, price_cents: 2900 },
    highlights: [
      'Everything in Pro',
      '500 cards synced across devices',
      '100 live hosted cards',
      'Ideal for rosters, locations, and seasonal staff'
    ]
  }
};

export const PLAN_ORDER: PlanTier[] = ['free', 'pro', 'business'];

export function isPlanTier(value: unknown): value is PlanTier {
  return value === 'free' || value === 'pro' || value === 'business';
}

export function formatPrice(cents: number) {
  if (cents === 0) return '$0';
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export type CloudErrorCode =
  | 'plan_limit:cloud_designs'
  | 'plan_limit:live_cards'
  | 'plan_limit:custom_slugs'
  | 'plan_limit:analytics'
  | 'slug_taken'
  | 'invalid_slug'
  | 'invalid_expiry'
  | 'not_authenticated'
  | 'not_found'
  | 'unknown';

const MESSAGES: Record<CloudErrorCode, string> = {
  'plan_limit:cloud_designs': 'You have reached your plan’s cloud sync limit. This card is still saved on this device.',
  'plan_limit:live_cards': 'You have reached your plan’s live card limit. Unpublish a card or upgrade.',
  'plan_limit:custom_slugs': 'Custom links are a Pro feature.',
  'plan_limit:analytics': 'View analytics are a Pro feature.',
  slug_taken: 'That link is already taken. Try another.',
  invalid_slug: 'Links use 3–48 lowercase letters, numbers, and dashes, and cannot start or end with a dash.',
  invalid_expiry: 'The link expiry must be in the future.',
  not_authenticated: 'Sign in to use CardForge Cloud.',
  not_found: 'That card could not be found.',
  unknown: 'CardForge Cloud could not complete that request. Try again in a moment.'
};

/** Map a Supabase/PostgREST error raised by our SQL functions to a stable code. */
export function cloudErrorCode(error: unknown): CloudErrorCode {
  const message = typeof error === 'object' && error && 'message' in error ? String((error as { message: unknown }).message) : String(error ?? '');
  const known = (Object.keys(MESSAGES) as CloudErrorCode[]).find((code) => code !== 'unknown' && message.includes(code));
  if (known) return known;
  if (/JWT|not authenticated|401/i.test(message)) return 'not_authenticated';
  return 'unknown';
}

export function cloudErrorMessage(error: unknown) {
  return MESSAGES[cloudErrorCode(error)];
}

export function isPlanLimit(error: unknown) {
  return cloudErrorCode(error).startsWith('plan_limit:');
}
