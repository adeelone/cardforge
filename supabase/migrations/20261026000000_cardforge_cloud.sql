-- CardForge Cloud: accounts, cloud sync, hosted cards, analytics, and plans.
--
-- Every business rule (plan quotas, custom-slug entitlement, badge removal,
-- analytics access, billing state) is enforced here, not in the browser.
-- Tables are protected by row-level security; anything that needs to cross
-- a user boundary or apply a plan rule goes through a SECURITY DEFINER
-- function with a pinned search_path.

-- ---------------------------------------------------------------------------
-- Plans
-- ---------------------------------------------------------------------------

create type public.plan_tier as enum ('free', 'pro', 'business');

-- Single source of truth for entitlements. The client mirrors these values in
-- src/lib/plans.ts for display only.
create function public.plan_limits(p_plan public.plan_tier)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select case p_plan
    when 'free' then jsonb_build_object(
      'cloud_designs', 3, 'live_cards', 1, 'custom_slugs', false,
      'analytics', false, 'remove_badge', false, 'price_cents', 0)
    when 'pro' then jsonb_build_object(
      'cloud_designs', 50, 'live_cards', 10, 'custom_slugs', true,
      'analytics', true, 'remove_badge', true, 'price_cents', 900)
    else jsonb_build_object(
      'cloud_designs', 500, 'live_cards', 100, 'custom_slugs', true,
      'analytics', true, 'remove_badge', true, 'price_cents', 2900)
  end
$$;

-- Flip to false once a real payment provider (e.g. a Stripe webhook) owns
-- the subscriptions table; the demo checkout functions then refuse to run.
create function public.demo_billing_enabled()
returns boolean
language sql
immutable
set search_path = ''
as $$ select true $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan public.plan_tier not null default 'free',
  status text not null default 'active' check (status in ('active', 'past_due', 'canceled')),
  provider text not null default 'demo' check (provider in ('demo', 'stripe')),
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.billing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('subscribed', 'changed', 'canceled', 'resumed')),
  plan public.plan_tier not null,
  amount_cents integer not null default 0 check (amount_cents >= 0),
  currency text not null default 'usd',
  provider text not null default 'demo',
  created_at timestamptz not null default now()
);
create index billing_events_user_created_idx on public.billing_events (user_id, created_at desc);

create table public.designs (
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (char_length(id) between 1 and 160),
  name text not null default '' check (char_length(name) <= 200),
  data jsonb not null check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 3000000),
  client_updated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, id)
);

create table public.published_cards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  design_id text not null check (char_length(design_id) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$'),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 1000000),
  is_active boolean not null default true,
  expires_at timestamptz,
  view_count bigint not null default 0,
  last_viewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, design_id)
);
create index published_cards_owner_idx on public.published_cards (owner_id);

-- Aggregate daily counts only: no IP address, user agent, referrer, or
-- per-visit row is ever stored.
create table public.card_view_days (
  card_id uuid not null references public.published_cards (id) on delete cascade,
  day date not null,
  views integer not null default 0,
  primary key (card_id, day)
);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.billing_events enable row level security;
alter table public.designs enable row level security;
alter table public.published_cards enable row level security;
alter table public.card_view_days enable row level security;

create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "subscriptions: read own" on public.subscriptions
  for select to authenticated using (user_id = (select auth.uid()));

create policy "billing: read own" on public.billing_events
  for select to authenticated using (user_id = (select auth.uid()));

create policy "designs: read own" on public.designs
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "designs: insert own" on public.designs
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "designs: update own" on public.designs
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "designs: delete own" on public.designs
  for delete to authenticated using (owner_id = (select auth.uid()));

-- Published cards are created and changed only through publish_card /
-- set_card_active so plan rules cannot be skipped; owners may read and
-- delete their own rows directly.
create policy "published: read own" on public.published_cards
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "published: delete own" on public.published_cards
  for delete to authenticated using (owner_id = (select auth.uid()));

-- card_view_days intentionally has no policies: it is only reachable through
-- card_analytics(), which checks the analytics entitlement.

-- Only the columns a user may legitimately change are writable.
revoke update on public.profiles from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;
revoke all on public.subscriptions, public.billing_events, public.card_view_days from anon;
revoke insert, update, delete on public.subscriptions, public.billing_events, public.card_view_days from authenticated;
revoke insert, update on public.published_cards from anon, authenticated;
revoke all on public.designs, public.published_cards, public.profiles from anon;

-- ---------------------------------------------------------------------------
-- Housekeeping triggers
-- ---------------------------------------------------------------------------

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger designs_touch before update on public.designs
  for each row execute function public.touch_updated_at();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 120))
  on conflict (id) do nothing;
  return new;
end
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Entitlements
-- ---------------------------------------------------------------------------

-- A subscription stays effective until the end of a canceled period. Demo
-- subscriptions that are not canceled renew implicitly.
create function public.effective_plan(p_user uuid)
returns public.plan_tier
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select s.plan
       from public.subscriptions s
      where s.user_id = p_user
        and s.status = 'active'
        and (not s.cancel_at_period_end or s.current_period_end is null or s.current_period_end > now())),
    'free'::public.plan_tier)
$$;

create function public.enforce_design_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit integer;
  v_used integer;
begin
  -- An upsert of an existing row fires BEFORE INSERT too; it is not new usage.
  if exists (select 1 from public.designs d where d.owner_id = new.owner_id and d.id = new.id) then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('designs:' || new.owner_id::text, 0));
  v_limit := (public.plan_limits(public.effective_plan(new.owner_id)) ->> 'cloud_designs')::integer;
  select count(*) into v_used from public.designs d where d.owner_id = new.owner_id;
  if v_used >= v_limit then
    raise exception 'plan_limit:cloud_designs' using errcode = 'P0001', detail = format('%s of %s cloud designs used', v_used, v_limit);
  end if;
  return new;
end
$$;

create trigger designs_quota before insert on public.designs
  for each row execute function public.enforce_design_quota();

-- ---------------------------------------------------------------------------
-- Cloud sync
-- ---------------------------------------------------------------------------

-- Last-writer-wins by the client's edit timestamp, so a stale tab cannot
-- overwrite newer work from another device. Runs as the caller (RLS applies).
create function public.save_design(p_id text, p_name text, p_data jsonb, p_client_updated_at timestamptz)
returns public.designs
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_row public.designs;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  insert into public.designs as d (owner_id, id, name, data, client_updated_at)
  values (auth.uid(), p_id, left(coalesce(p_name, ''), 200), p_data, p_client_updated_at)
  on conflict (owner_id, id) do update
    set name = excluded.name, data = excluded.data, client_updated_at = excluded.client_updated_at
    where d.client_updated_at <= excluded.client_updated_at
  returning * into v_row;
  if v_row is null then
    select * into v_row from public.designs d where d.owner_id = auth.uid() and d.id = p_id;
  end if;
  return v_row;
end
$$;

-- ---------------------------------------------------------------------------
-- Hosted digital cards
-- ---------------------------------------------------------------------------

create function public.is_reserved_slug(p_slug text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_slug = any (array[
    'admin', 'api', 'app', 'account', 'billing', 'cardforge', 'help', 'login', 'new',
    'pricing', 'privacy', 'security', 'settings', 'support', 'terms', 'trust', 'www'])
$$;

create function public.publish_card(
  p_design_id text,
  p_payload jsonb,
  p_slug text default null,
  p_expires_at timestamptz default null)
returns public.published_cards
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_limits jsonb;
  v_existing public.published_cards;
  v_slug text;
  v_live integer;
  v_row public.published_cards;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if p_expires_at is not null and p_expires_at <= now() then
    raise exception 'invalid_expiry' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('cards:' || v_uid::text, 0));
  v_limits := public.plan_limits(public.effective_plan(v_uid));
  select * into v_existing from public.published_cards c where c.owner_id = v_uid and c.design_id = p_design_id;

  if p_slug is not null and p_slug <> '' and p_slug is distinct from v_existing.slug then
    if not (v_limits ->> 'custom_slugs')::boolean then
      raise exception 'plan_limit:custom_slugs' using errcode = 'P0001';
    end if;
    v_slug := lower(p_slug);
    if v_slug !~ '^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$' then
      raise exception 'invalid_slug' using errcode = '22023';
    end if;
    if public.is_reserved_slug(v_slug) then
      raise exception 'slug_taken' using errcode = '23505';
    end if;
    if exists (select 1 from public.published_cards c where c.slug = v_slug) then
      raise exception 'slug_taken' using errcode = '23505';
    end if;
  else
    v_slug := v_existing.slug;
    while v_slug is null loop
      v_slug := substr(md5(gen_random_uuid()::text), 1, 8);
      if exists (select 1 from public.published_cards c where c.slug = v_slug) then
        v_slug := null;
      end if;
    end loop;
  end if;

  if v_existing.id is null or not v_existing.is_active
     or (v_existing.expires_at is not null and v_existing.expires_at <= now()) then
    select count(*) into v_live
      from public.published_cards c
     where c.owner_id = v_uid and c.is_active and (c.expires_at is null or c.expires_at > now());
    if v_live >= (v_limits ->> 'live_cards')::integer then
      raise exception 'plan_limit:live_cards' using errcode = 'P0001',
        detail = format('%s of %s live cards in use', v_live, v_limits ->> 'live_cards');
    end if;
  end if;

  insert into public.published_cards as c (owner_id, design_id, slug, payload, is_active, expires_at)
  values (v_uid, p_design_id, v_slug, p_payload, true, p_expires_at)
  on conflict (owner_id, design_id) do update
    set slug = excluded.slug, payload = excluded.payload, is_active = true,
        expires_at = excluded.expires_at, updated_at = now()
  returning * into v_row;
  return v_row;
end
$$;

create function public.set_card_active(p_card_id uuid, p_active boolean)
returns public.published_cards
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_card public.published_cards;
  v_live integer;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('cards:' || v_uid::text, 0));
  select * into v_card from public.published_cards c where c.id = p_card_id and c.owner_id = v_uid;
  if v_card.id is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if p_active and not v_card.is_active then
    select count(*) into v_live
      from public.published_cards c
     where c.owner_id = v_uid and c.is_active and (c.expires_at is null or c.expires_at > now());
    if v_live >= (public.plan_limits(public.effective_plan(v_uid)) ->> 'live_cards')::integer then
      raise exception 'plan_limit:live_cards' using errcode = 'P0001';
    end if;
  end if;
  update public.published_cards c set is_active = p_active, updated_at = now()
   where c.id = p_card_id
  returning * into v_card;
  return v_card;
end
$$;

-- Public, anonymous read of one hosted card. Returns null for unknown slugs
-- and {status: 'unavailable'} for revoked or expired ones. Visits by the
-- owner are not counted.
create function public.get_public_card(p_slug text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_card public.published_cards;
begin
  if p_slug is null or char_length(p_slug) > 48 then
    return null;
  end if;
  select * into v_card from public.published_cards c where c.slug = lower(p_slug);
  if v_card.id is null then
    return null;
  end if;
  if not v_card.is_active or (v_card.expires_at is not null and v_card.expires_at <= now()) then
    return jsonb_build_object('status', 'unavailable');
  end if;
  if auth.uid() is distinct from v_card.owner_id then
    update public.published_cards c
       set view_count = c.view_count + 1, last_viewed_at = now()
     where c.id = v_card.id;
    insert into public.card_view_days as v (card_id, day, views)
    values (v_card.id, (now() at time zone 'utc')::date, 1)
    on conflict (card_id, day) do update set views = v.views + 1;
  end if;
  return jsonb_build_object(
    'status', 'ok',
    'payload', v_card.payload,
    'showBadge', not (public.plan_limits(public.effective_plan(v_card.owner_id)) ->> 'remove_badge')::boolean,
    'updatedAt', v_card.updated_at);
end
$$;

create function public.card_analytics(p_card_id uuid, p_days integer default 30)
returns table (day date, views integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if not exists (select 1 from public.published_cards c where c.id = p_card_id and c.owner_id = v_uid) then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if not (public.plan_limits(public.effective_plan(v_uid)) ->> 'analytics')::boolean then
    raise exception 'plan_limit:analytics' using errcode = 'P0001';
  end if;
  return query
    select g.day::date, coalesce(v.views, 0)
      from generate_series(
             (now() at time zone 'utc')::date - (least(greatest(p_days, 1), 365) - 1),
             (now() at time zone 'utc')::date,
             interval '1 day') as g(day)
      left join public.card_view_days v on v.card_id = p_card_id and v.day = g.day::date
     order by 1;
end
$$;

-- ---------------------------------------------------------------------------
-- Account & billing
-- ---------------------------------------------------------------------------

create function public.get_account_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_plan public.plan_tier;
  v_sub public.subscriptions;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  v_plan := public.effective_plan(v_uid);
  select * into v_sub from public.subscriptions s where s.user_id = v_uid;
  return jsonb_build_object(
    'plan', v_plan,
    'limits', public.plan_limits(v_plan),
    'subscription', case when v_sub.user_id is null then null else jsonb_build_object(
      'plan', v_sub.plan,
      'status', v_sub.status,
      'provider', v_sub.provider,
      'currentPeriodEnd', v_sub.current_period_end,
      'cancelAtPeriodEnd', v_sub.cancel_at_period_end) end,
    'usage', jsonb_build_object(
      'cloud_designs', (select count(*) from public.designs d where d.owner_id = v_uid),
      'live_cards', (select count(*) from public.published_cards c
                      where c.owner_id = v_uid and c.is_active and (c.expires_at is null or c.expires_at > now())),
      'total_views', (select coalesce(sum(c.view_count), 0) from public.published_cards c where c.owner_id = v_uid)),
    'demoBilling', public.demo_billing_enabled());
end
$$;

create function public.demo_checkout(p_plan public.plan_tier)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_previous public.plan_tier;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if not public.demo_billing_enabled() then
    raise exception 'demo_billing_disabled' using errcode = '42501';
  end if;
  if p_plan = 'free' then
    raise exception 'invalid_plan' using errcode = '22023';
  end if;
  v_previous := public.effective_plan(v_uid);
  insert into public.subscriptions as s (user_id, plan, status, provider, current_period_start, current_period_end, cancel_at_period_end, updated_at)
  values (v_uid, p_plan, 'active', 'demo', now(), now() + interval '1 month', false, now())
  on conflict (user_id) do update
    set plan = excluded.plan, status = 'active', provider = 'demo',
        current_period_start = excluded.current_period_start,
        current_period_end = excluded.current_period_end,
        cancel_at_period_end = false, updated_at = now();
  insert into public.billing_events (user_id, kind, plan, amount_cents)
  values (v_uid, case when v_previous = 'free' then 'subscribed' else 'changed' end, p_plan,
          (public.plan_limits(p_plan) ->> 'price_cents')::integer);
  return public.get_account_overview();
end
$$;

create function public.set_subscription_cancel(p_cancel boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_sub public.subscriptions;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if not public.demo_billing_enabled() then
    raise exception 'demo_billing_disabled' using errcode = '42501';
  end if;
  update public.subscriptions s
     set cancel_at_period_end = p_cancel, updated_at = now()
   where s.user_id = v_uid and s.status = 'active' and s.cancel_at_period_end is distinct from p_cancel
     and (s.current_period_end is null or s.current_period_end > now())
  returning * into v_sub;
  if v_sub.user_id is not null then
    insert into public.billing_events (user_id, kind, plan)
    values (v_uid, case when p_cancel then 'canceled' else 'resumed' end, v_sub.plan);
  end if;
  return public.get_account_overview();
end
$$;

-- Self-service erasure. Cascades remove the profile, subscription, billing
-- history, cloud designs, hosted cards, and their view counts.
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  delete from auth.users u where u.id = auth.uid();
end
$$;

-- ---------------------------------------------------------------------------
-- Function privileges: nothing is callable unless granted below.
-- ---------------------------------------------------------------------------

revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.get_public_card(text) to anon, authenticated;
grant execute on function public.save_design(text, text, jsonb, timestamptz) to authenticated;
grant execute on function public.publish_card(text, jsonb, text, timestamptz) to authenticated;
grant execute on function public.set_card_active(uuid, boolean) to authenticated;
grant execute on function public.card_analytics(uuid, integer) to authenticated;
grant execute on function public.get_account_overview() to authenticated;
grant execute on function public.demo_checkout(public.plan_tier) to authenticated;
grant execute on function public.set_subscription_cancel(boolean) to authenticated;
grant execute on function public.delete_my_account() to authenticated;

-- Trigger functions run as their owner; no direct grants are needed. Keep
-- functions created later private by default as well.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
