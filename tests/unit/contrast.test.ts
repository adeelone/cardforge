import { describe, expect, it } from 'vitest';
import { contrastRatio, paletteFromSeed, passesAA } from '../../src/lib/contrast';

describe('contrast helpers', () => {
  it('checks AA contrast', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeGreaterThan(20);
    expect(passesAA('#000000', '#ffffff')).toBe(true);
  });

  it('creates a five color palette', () => {
    expect(paletteFromSeed('#1f5f5b')).toHaveLength(5);
  });
});
