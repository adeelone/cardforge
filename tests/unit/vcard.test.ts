import { describe, expect, it } from 'vitest';
import { createStarterDesign } from '../../src/editor/templates/templates';
import { createVCard } from '../../src/exporters/vcard';

describe('vCard exporter', () => {
  it('writes a vCard 4 file', () => {
    const card = createVCard(createStarterDesign());
    expect(card).toContain('BEGIN:VCARD');
    expect(card).toContain('VERSION:4.0');
    expect(card).toContain('FN:Avery Stone');
  });
});
