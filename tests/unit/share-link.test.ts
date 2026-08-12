import { describe, expect, it } from 'vitest';
import { createStarterDesign } from '../../src/editor/templates/templates';
import { buildShareUrl, decodeSharePayload, encodeSharePayload } from '../../src/exporters/share-link';

describe('share link encoding', () => {
  it('round trips a design', () => {
    const design = createStarterDesign();
    expect(decodeSharePayload(encodeSharePayload(design))?.meta.id).toBe(design.meta.id);
  });

  it('survives a full URL + URLSearchParams round trip (the "+" becomes space bug)', () => {
    const design = createStarterDesign('neon');
    const url = new URL(buildShareUrl(design));
    const payload = url.searchParams.get('d');
    expect(payload).toBeTruthy();
    expect(decodeSharePayload(payload as string)?.identity.name).toBe(design.identity.name);
  });

  it('decodes even when "+" was corrupted to a space', () => {
    const design = createStarterDesign();
    const raw = encodeSharePayload(design);
    const corrupted = raw.replaceAll('+', ' ');
    expect(decodeSharePayload(corrupted)?.meta.id).toBe(design.meta.id);
  });
});
