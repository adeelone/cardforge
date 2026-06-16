import { describe, expect, it } from 'vitest';
import { createStarterDesign } from '../../src/editor/templates/templates';
import { decodeSharePayload, encodeSharePayload } from '../../src/exporters/share-link';

describe('share link encoding', () => {
  it('round trips a design', () => {
    const design = createStarterDesign();
    expect(decodeSharePayload(encodeSharePayload(design))?.meta.id).toBe(design.meta.id);
  });
});
