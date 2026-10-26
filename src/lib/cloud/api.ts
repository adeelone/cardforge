import type { Design } from '../../types/design';
import { normalizeDesign, sanitizeSharedDesign } from '../design-security';
import type { PlanTier } from '../plans';
import { getSupabase } from './client';
import { parseOverview, useSession, type AccountOverview } from './session';

export interface CloudDesignStamp {
  id: string;
  name: string;
  clientUpdatedAt: string;
}

export interface PublishedCard {
  id: string;
  designId: string;
  slug: string;
  isActive: boolean;
  expiresAt: string | null;
  viewCount: number;
  lastViewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillingEvent {
  id: string;
  kind: 'subscribed' | 'changed' | 'canceled' | 'resumed';
  plan: PlanTier;
  amountCents: number;
  currency: string;
  provider: string;
  createdAt: string;
}

export type PublicCardResult =
  | { status: 'ok'; design: Design; showBadge: boolean }
  | { status: 'unavailable' }
  | { status: 'missing' };

function fail(error: unknown): never {
  throw error instanceof Error ? error : Object.assign(new Error(String((error as { message?: string })?.message ?? error)), { cause: error });
}

function toPublished(row: Record<string, unknown>): PublishedCard {
  return {
    id: String(row.id),
    designId: String(row.design_id),
    slug: String(row.slug),
    isActive: Boolean(row.is_active),
    expiresAt: (row.expires_at as string | null) ?? null,
    viewCount: Number(row.view_count) || 0,
    lastViewedAt: (row.last_viewed_at as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

/** A hosted card resolves for visitors only while active and unexpired. */
export function isCardLive(card: Pick<PublishedCard, 'isActive' | 'expiresAt'>, now = Date.now()) {
  return card.isActive && (!card.expiresAt || Date.parse(card.expiresAt) > now);
}

export function isCardExpired(card: Pick<PublishedCard, 'expiresAt'>, now = Date.now()) {
  return Boolean(card.expiresAt && Date.parse(card.expiresAt) <= now);
}

// --- Designs --------------------------------------------------------------

export async function pushCloudDesign(design: Design) {
  const supabase = await getSupabase();
  const { error } = await supabase.rpc('save_design', {
    p_id: design.meta.id,
    p_name: design.meta.name,
    p_data: design,
    p_client_updated_at: design.meta.updatedAt
  });
  if (error) fail(error);
}

export async function listCloudDesignStamps(): Promise<CloudDesignStamp[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('designs').select('id, name, client_updated_at').order('client_updated_at', { ascending: false });
  if (error) fail(error);
  return (data ?? []).map((row) => ({ id: row.id as string, name: row.name as string, clientUpdatedAt: row.client_updated_at as string }));
}

export async function fetchCloudDesigns(ids: string[]): Promise<Design[]> {
  if (!ids.length) return [];
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('designs').select('data').in('id', ids);
  if (error) fail(error);
  return (data ?? []).map((row) => normalizeDesign(row.data)).filter((design): design is Design => Boolean(design));
}

export async function deleteCloudDesign(id: string) {
  const supabase = await getSupabase();
  const [designs, cards] = await Promise.all([
    supabase.from('designs').delete().eq('id', id),
    supabase.from('published_cards').delete().eq('design_id', id)
  ]);
  if (designs.error) fail(designs.error);
  if (cards.error) fail(cards.error);
}

// --- Hosted cards ---------------------------------------------------------

/** Publish (or republish) the share-filtered copy of a design as a hosted card. */
export async function publishCard(design: Design, options: { slug?: string } = {}) {
  const supabase = await getSupabase();
  const expiresAt = design.share.expiresAt && Date.parse(design.share.expiresAt) > Date.now() ? design.share.expiresAt : null;
  const { data, error } = await supabase.rpc('publish_card', {
    p_design_id: design.meta.id,
    p_payload: sanitizeSharedDesign(design),
    p_slug: options.slug?.trim().toLowerCase() || null,
    p_expires_at: expiresAt
  });
  if (error) fail(error);
  return toPublished(data as Record<string, unknown>);
}

export async function listPublishedCards(): Promise<PublishedCard[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('published_cards')
    .select('id, design_id, slug, is_active, expires_at, view_count, last_viewed_at, created_at, updated_at')
    .order('updated_at', { ascending: false });
  if (error) fail(error);
  return (data ?? []).map((row) => toPublished(row));
}

export async function setCardActive(cardId: string, active: boolean) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc('set_card_active', { p_card_id: cardId, p_active: active });
  if (error) fail(error);
  return toPublished(data as Record<string, unknown>);
}

export async function deletePublishedCard(cardId: string) {
  const supabase = await getSupabase();
  const { error } = await supabase.from('published_cards').delete().eq('id', cardId);
  if (error) fail(error);
}

export async function cardAnalytics(cardId: string, days = 30): Promise<{ day: string; views: number }[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc('card_analytics', { p_card_id: cardId, p_days: days });
  if (error) fail(error);
  return ((data ?? []) as { day: string; views: number }[]).map((row) => ({ day: row.day, views: Number(row.views) || 0 }));
}

/** Anonymous read of a hosted card. Payloads are re-validated like any import. */
export async function getPublicCard(slug: string): Promise<PublicCardResult> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc('get_public_card', { p_slug: slug });
  if (error) fail(error);
  if (!data) return { status: 'missing' };
  const result = data as { status?: string; payload?: unknown; showBadge?: boolean };
  if (result.status !== 'ok') return { status: 'unavailable' };
  const design = normalizeDesign(result.payload);
  return design ? { status: 'ok', design, showBadge: result.showBadge !== false } : { status: 'missing' };
}

// --- Account & billing ----------------------------------------------------

async function overviewCall(fn: 'demo_checkout' | 'set_subscription_cancel', args: Record<string, unknown>) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc(fn, args);
  if (error) fail(error);
  const overview = parseOverview(data);
  if (overview) useSession.getState().setOverview(overview);
  return overview as AccountOverview;
}

export function demoCheckout(plan: Exclude<PlanTier, 'free'>) {
  return overviewCall('demo_checkout', { p_plan: plan });
}

export function setSubscriptionCancel(cancel: boolean) {
  return overviewCall('set_subscription_cancel', { p_cancel: cancel });
}

export async function listBillingEvents(): Promise<BillingEvent[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('billing_events')
    .select('id, kind, plan, amount_cents, currency, provider, created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) fail(error);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    kind: row.kind as BillingEvent['kind'],
    plan: row.plan as PlanTier,
    amountCents: Number(row.amount_cents) || 0,
    currency: row.currency as string,
    provider: row.provider as string,
    createdAt: row.created_at as string
  }));
}

export async function updateDisplayName(displayName: string) {
  const supabase = await getSupabase();
  const value = displayName.trim().slice(0, 120);
  const { error } = await supabase.auth.updateUser({ data: { display_name: value } });
  if (error) fail(error);
  const userId = useSession.getState().user?.id;
  if (userId) {
    const profile = await supabase.from('profiles').update({ display_name: value }).eq('id', userId);
    if (profile.error) fail(profile.error);
  }
}

export async function deleteAccount() {
  const supabase = await getSupabase();
  const { error } = await supabase.rpc('delete_my_account');
  if (error) fail(error);
  await supabase.auth.signOut({ scope: 'local' });
}

export async function signOut() {
  const supabase = await getSupabase();
  await supabase.auth.signOut();
}
