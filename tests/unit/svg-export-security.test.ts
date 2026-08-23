import { describe, expect, it } from 'vitest';
import { createStarterDesign } from '../../src/editor/templates/templates';
import { exportSvgBundle } from '../../src/exporters/svg';
import { normalizeDesign } from '../../src/lib/design-security';

const MALICIOUS_ID = 'x"><script>alert(document.domain)</script><a id="y';

describe('SVG export id injection', () => {
  it('normalizeDesign does not restrict element id to a safe charset (the vulnerable precondition)', () => {
    const design = createStarterDesign();
    const withMaliciousId = {
      ...design,
      elements: [{ ...design.elements[0], id: MALICIOUS_ID, kind: 'shape', shape: 'rect', gradient: ['#ff0000', '#00ff00'] }]
    };
    const normalized = normalizeDesign(withMaliciousId);
    expect(normalized?.elements[0].id).toBe(MALICIOUS_ID);
  });

  it('never emits an unescaped <script> tag from a gradient shape with a malicious element id', async () => {
    const design = createStarterDesign();
    design.elements = [
      {
        ...design.elements[0],
        id: MALICIOUS_ID,
        side: 'front',
        kind: 'shape',
        shape: 'rect',
        label: 'Evil',
        gradient: ['#ff0000', '#00ff00'],
        z: 0
      }
    ];
    const svg = await exportSvgBundle(design);
    expect(svg).not.toContain('<script>');
    expect(svg).not.toMatch(/"><script/);
  });

  it('never emits an unescaped <script> tag from an image clip path with a malicious element id', async () => {
    const design = createStarterDesign();
    design.assets = [{ id: 'asset-1', name: 'logo.png', mime: 'image/png', dataUrl: 'data:image/png;base64,AAAA' }];
    design.elements = [
      {
        ...design.elements[0],
        id: MALICIOUS_ID,
        side: 'front',
        kind: 'image',
        label: 'Evil image',
        assetId: 'asset-1',
        z: 0
      }
    ];
    const svg = await exportSvgBundle(design);
    expect(svg).not.toContain('<script>');
    expect(svg).not.toMatch(/"><script/);
  });
});
