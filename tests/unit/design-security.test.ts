import { describe, expect, it } from 'vitest';
import { createStarterDesign } from '../../src/editor/templates/templates';
import {
  isShareExpired,
  MAX_SHARE_PAYLOAD_LENGTH,
  normalizeDesign,
  safeContactHref,
  sanitizeSharedDesign
} from '../../src/lib/design-security';

describe('design security boundary', () => {
  it('adds safe defaults to legacy designs', () => {
    const legacy = createStarterDesign() as Partial<ReturnType<typeof createStarterDesign>>;
    delete legacy.qrStyle;
    delete legacy.share;
    const normalized = normalizeDesign(legacy);
    expect(normalized?.qrStyle.pattern).toBe('rounded');
    expect(normalized?.share.includeAddress).toBe(false);
  });

  it('removes excluded share fields and raster assets', () => {
    const design = createStarterDesign();
    design.contacts.push({ id: 'address', kind: 'address', label: 'Office', value: '123 Main St' });
    design.share.includePhone = false;
    design.share.includeImages = false;
    design.identity.pronouns = 'they/them';
    design.share.includePronouns = false;
    const shared = sanitizeSharedDesign(design);
    expect(shared.contacts.some((contact) => contact.kind === 'phone')).toBe(false);
    expect(shared.contacts.some((contact) => contact.kind === 'address')).toBe(false);
    expect(shared.identity.pronouns).toBe('');
    expect(shared.assets).toEqual([]);
    expect(shared.variants).toEqual([]);
  });

  it('drops active SVG assets from imported data', () => {
    const design = createStarterDesign();
    design.assets = [{ id: 'svg', name: 'unsafe.svg', mime: 'image/svg+xml', dataUrl: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=' }];
    design.elements.push({ id: 'image', side: 'front', kind: 'image', label: 'Unsafe', x: 0, y: 0, width: 10, height: 10, rotation: 0, locked: false, hidden: false, z: 4, assetId: 'svg' });
    const normalized = normalizeDesign(design);
    expect(normalized?.assets).toEqual([]);
    expect(normalized?.elements.some((element) => element.id === 'image')).toBe(false);
  });

  it('deeply normalizes malformed nested fields and extreme geometry', () => {
    const unsafe = createStarterDesign() as unknown as Record<string, unknown>;
    (unsafe.identity as Record<string, unknown>).tagline = { injected: true };
    const element = (unsafe.elements as Record<string, unknown>[])[0];
    element.kind = 'script';
    element.x = Number.MAX_VALUE;
    element.text = { html: '<img onerror=alert(1)>' };
    const normalized = normalizeDesign(unsafe);
    expect(normalized?.identity.tagline).toBe('');
    expect(normalized?.elements[0].kind).toBe('text');
    expect(normalized?.elements[0].x).toBe(10_000);
    expect(normalized?.elements[0].text).toBeUndefined();
  });

  it('rejects unsafe link protocols and malformed payload sizes', () => {
    expect(safeContactHref({ id: 'x', kind: 'website', label: 'Site', value: 'javascript:alert(1)' })).toBeUndefined();
    expect(safeContactHref({ id: 'x', kind: 'website', label: 'Site', value: 'example.com' })).toBe('https://example.com/');
    expect(MAX_SHARE_PAYLOAD_LENGTH).toBeLessThan(100_000);
  });

  it('recognizes expired shared cards', () => {
    const design = createStarterDesign();
    design.share.expiresAt = '2020-01-01T00:00:00.000Z';
    expect(isShareExpired(design)).toBe(true);
  });
});
