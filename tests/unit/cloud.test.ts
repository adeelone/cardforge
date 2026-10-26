import { describe, expect, it } from 'vitest';
import { cloudErrorCode, cloudErrorMessage, formatPrice, isPlanLimit, PLANS } from '../../src/lib/plans';
import { planSync } from '../../src/lib/cloud/sync';
import { parseOverview } from '../../src/lib/cloud/session';
import { isCardExpired, isCardLive } from '../../src/lib/cloud/api';
import { safeNext } from '../../src/lib/redirect';

const meta = (id: string, updatedAt: string) => ({ meta: { id, updatedAt } }) as never;

describe('plan errors', () => {
  it('maps database exceptions to stable codes', () => {
    expect(cloudErrorCode({ message: 'plan_limit:live_cards' })).toBe('plan_limit:live_cards');
    expect(cloudErrorCode(new Error('slug_taken'))).toBe('slug_taken');
    expect(cloudErrorCode({ message: 'JWT expired' })).toBe('not_authenticated');
    expect(cloudErrorCode('boom')).toBe('unknown');
    expect(isPlanLimit({ message: 'plan_limit:cloud_designs' })).toBe(true);
    expect(isPlanLimit({ message: 'slug_taken' })).toBe(false);
    expect(cloudErrorMessage({ message: 'plan_limit:custom_slugs' })).toMatch(/Pro feature/);
  });

  it('formats prices and keeps paid tiers ordered', () => {
    expect(formatPrice(0)).toBe('$0');
    expect(formatPrice(900)).toBe('$9');
    expect(formatPrice(1250)).toBe('$12.50');
    expect(PLANS.pro.limits.live_cards).toBeGreaterThan(PLANS.free.limits.live_cards);
    expect(PLANS.business.limits.cloud_designs).toBeGreaterThan(PLANS.pro.limits.cloud_designs);
  });
});

describe('planSync', () => {
  it('pulls newer or missing cloud copies and pushes newer local copies of synced designs', () => {
    const local = [meta('a', '2026-10-01T00:00:00Z'), meta('b', '2026-10-05T00:00:00Z'), meta('local-only', '2026-10-05T00:00:00Z')];
    const remote = [
      { id: 'a', name: 'A', clientUpdatedAt: '2026-10-03T00:00:00Z' },
      { id: 'b', name: 'B', clientUpdatedAt: '2026-10-02T00:00:00Z' },
      { id: 'c', name: 'C', clientUpdatedAt: '2026-10-02T00:00:00Z' }
    ];
    const plan = planSync(local, remote);
    expect(plan.pull.sort()).toEqual(['a', 'c']);
    expect(plan.push).toEqual(['b']);
    expect([...plan.cloudIds].sort()).toEqual(['a', 'b', 'c']);
  });

  it('treats equal timestamps as in sync', () => {
    const plan = planSync([meta('a', '2026-10-01T00:00:00.000Z')], [{ id: 'a', name: 'A', clientUpdatedAt: '2026-10-01T00:00:00+00:00' }]);
    expect(plan.pull).toEqual([]);
    expect(plan.push).toEqual([]);
  });
});

describe('parseOverview', () => {
  it('fills defaults and rejects unknown plans', () => {
    const overview = parseOverview({ plan: 'enterprise', usage: { cloud_designs: '2' } });
    expect(overview?.plan).toBe('free');
    expect(overview?.limits.cloud_designs).toBe(PLANS.free.limits.cloud_designs);
    expect(overview?.usage.cloud_designs).toBe(2);
    expect(overview?.subscription).toBeNull();
    expect(parseOverview(null)).toBeNull();
  });

  it('reads an active subscription', () => {
    const overview = parseOverview({
      plan: 'pro',
      limits: PLANS.pro.limits,
      subscription: { plan: 'pro', status: 'active', provider: 'demo', currentPeriodEnd: '2026-11-26T00:00:00Z', cancelAtPeriodEnd: true },
      usage: { cloud_designs: 4, live_cards: 2, total_views: 31 },
      demoBilling: true
    });
    expect(overview?.subscription?.cancelAtPeriodEnd).toBe(true);
    expect(overview?.usage.total_views).toBe(31);
  });
});

describe('hosted card state', () => {
  const now = Date.parse('2026-10-26T12:00:00Z');
  it('is live only when active and unexpired', () => {
    expect(isCardLive({ isActive: true, expiresAt: null }, now)).toBe(true);
    expect(isCardLive({ isActive: false, expiresAt: null }, now)).toBe(false);
    expect(isCardLive({ isActive: true, expiresAt: '2026-10-25T00:00:00Z' }, now)).toBe(false);
    expect(isCardExpired({ expiresAt: '2026-10-25T00:00:00Z' }, now)).toBe(true);
    expect(isCardExpired({ expiresAt: '2026-10-27T00:00:00Z' }, now)).toBe(false);
  });
});

describe('safeNext', () => {
  it('only allows same-app relative paths', () => {
    expect(safeNext('/checkout/pro')).toBe('/checkout/pro');
    expect(safeNext('/design/abc?x=1')).toBe('/design/abc?x=1');
    expect(safeNext('//evil.example')).toBe('/account');
    expect(safeNext('https://evil.example')).toBe('/account');
    expect(safeNext('/\\evil.example')).toBe('/account');
    expect(safeNext('javascript:alert(1)')).toBe('/account');
    expect(safeNext(null)).toBe('/account');
  });
});
