import { describe, expect, it } from 'vitest';
import { canvasDims, formatDimensions, presetSize } from '../../src/lib/units';

describe('canvas dimensions', () => {
  it('keeps a landscape US card at 1.75:1', () => {
    const { widthMm, heightMm } = presetSize('us', 'landscape');
    const { w, h } = canvasDims({ widthMm, heightMm });
    expect(w).toBe(336);
    expect(Math.round((w / h) * 100)).toBe(175);
  });

  it('makes a square card square', () => {
    const { w, h } = canvasDims({ widthMm: 65, heightMm: 65 });
    expect(w).toBe(h);
  });

  it('formats inches and millimeters', () => {
    expect(formatDimensions(88.9, 50.8, 'in')).toContain('in');
    expect(formatDimensions(88.9, 50.8, 'mm')).toContain('mm');
  });
});
