import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { cloudEnabled, getSupabase, hasStoredSession } from './client';
import { isPlanTier, PLANS, type PlanLimits, type PlanTier } from '../plans';

export interface AccountOverview {
  plan: PlanTier;
  limits: PlanLimits;
  subscription: {
    plan: PlanTier;
    status: 'active' | 'past_due' | 'canceled';
    provider: 'demo' | 'stripe';
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  usage: { cloud_designs: number; live_cards: number; total_views: number };
  demoBilling: boolean;
}

export interface CloudUser {
  id: string;
  email: string;
  displayName: string;
}

type Status = 'disabled' | 'idle' | 'loading' | 'signed-out' | 'signed-in';

interface SessionStore {
  status: Status;
  user: CloudUser | null;
  overview: AccountOverview | null;
  /** Set when the visitor arrived from a password-reset email. */
  recovering: boolean;
  start: () => Promise<void>;
  refreshOverview: () => Promise<AccountOverview | null>;
  setOverview: (overview: AccountOverview) => void;
  clearRecovering: () => void;
}

function toUser(session: Session | null): CloudUser | null {
  if (!session?.user) return null;
  const meta = session.user.user_metadata ?? {};
  return {
    id: session.user.id,
    email: session.user.email ?? '',
    displayName: typeof meta.display_name === 'string' ? meta.display_name : ''
  };
}

/** Coerce the get_account_overview() payload into a well-typed object. */
export function parseOverview(value: unknown): AccountOverview | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const plan = isPlanTier(raw.plan) ? raw.plan : 'free';
  const usage = (raw.usage ?? {}) as Record<string, unknown>;
  const sub = raw.subscription as Record<string, unknown> | null | undefined;
  return {
    plan,
    limits: { ...PLANS[plan].limits, ...(raw.limits as Partial<PlanLimits> | undefined) },
    subscription: sub && isPlanTier(sub.plan)
      ? {
          plan: sub.plan,
          status: sub.status === 'past_due' || sub.status === 'canceled' ? sub.status : 'active',
          provider: sub.provider === 'stripe' ? 'stripe' : 'demo',
          currentPeriodEnd: typeof sub.currentPeriodEnd === 'string' ? sub.currentPeriodEnd : null,
          cancelAtPeriodEnd: Boolean(sub.cancelAtPeriodEnd)
        }
      : null,
    usage: {
      cloud_designs: Number(usage.cloud_designs) || 0,
      live_cards: Number(usage.live_cards) || 0,
      total_views: Number(usage.total_views) || 0
    },
    demoBilling: Boolean(raw.demoBilling)
  };
}

let started: Promise<void> | null = null;

export const useSession = create<SessionStore>((set, get) => ({
  status: cloudEnabled ? 'idle' : 'disabled',
  user: null,
  overview: null,
  recovering: false,
  start: () => {
    if (!cloudEnabled) return Promise.resolve();
    started ??= (async () => {
      set({ status: 'loading' });
      try {
        const supabase = await getSupabase();
        supabase.auth.onAuthStateChange((event, session) => {
          const user = toUser(session);
          set({ user, status: user ? 'signed-in' : 'signed-out', ...(event === 'PASSWORD_RECOVERY' ? { recovering: true } : {}) });
          if (!user) set({ overview: null });
          // Never await Supabase calls inside this callback (it holds the auth lock).
          else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') setTimeout(() => void get().refreshOverview(), 0);
        });
        const { data } = await supabase.auth.getSession();
        const user = toUser(data.session);
        set({ user, status: user ? 'signed-in' : 'signed-out' });
      } catch (error) {
        console.error(error);
        set({ status: 'signed-out' });
      }
    })();
    return started;
  },
  refreshOverview: async () => {
    if (get().status !== 'signed-in') return null;
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase.rpc('get_account_overview');
      if (error) throw error;
      const overview = parseOverview(data);
      set({ overview });
      return overview;
    } catch (error) {
      console.error(error);
      return null;
    }
  },
  setOverview: (overview) => set({ overview }),
  clearRecovering: () => set({ recovering: false })
}));

/**
 * Start the session only when it can matter: a stored session, or an auth
 * redirect (magic link, confirmation, password reset) in the URL. Anonymous
 * visitors therefore never download the SDK until they open a cloud page.
 */
export function bootSession() {
  if (!cloudEnabled) return;
  const params = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  if (hasStoredSession() || params.has('code') || params.has('error_description') || hash.has('access_token')) {
    void useSession.getState().start();
  }
}

/** Resolve once the session state is known (starting it if needed). */
export async function ensureSession() {
  await useSession.getState().start();
  return useSession.getState();
}

export function currentPlan(): PlanTier {
  return useSession.getState().overview?.plan ?? 'free';
}
