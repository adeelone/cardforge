import type { SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';

/**
 * CardForge Cloud is optional. Without both public values the app runs in its
 * original local-only mode and never loads the Supabase SDK.
 */
export const cloudEnabled = /^https:\/\/[a-z0-9.-]+$/i.test(url) && key.length > 20;

let clientPromise: Promise<SupabaseClient> | null = null;

/** Lazily import and memoize the Supabase client so it stays out of the initial bundle. */
export function getSupabase(): Promise<SupabaseClient> {
  if (!cloudEnabled) return Promise.reject(new Error('CardForge Cloud is not configured for this deployment'));
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'cardforge:auth'
      }
    })
  );
  return clientPromise;
}

/** True when this browser already holds a persisted session, so startup can skip the SDK otherwise. */
export function hasStoredSession() {
  try {
    return Boolean(localStorage.getItem('cardforge:auth'));
  } catch {
    return false;
  }
}
