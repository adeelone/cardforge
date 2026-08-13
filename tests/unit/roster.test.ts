import { describe, expect, it } from 'vitest';
import { createStarterDesign } from '../../src/editor/templates/templates';
import { rosterTemplateCsv, variantsFromCsv, variantsToCsv } from '../../src/lib/roster';

describe('roster CSV', () => {
  it('imports the documented template', () => {
    const variants = variantsFromCsv(rosterTemplateCsv(), createStarterDesign());
    expect(variants).toHaveLength(1);
    expect(variants[0].identity.name).toBe('Alex Rivera');
    expect(variants[0].contacts.some((contact) => contact.kind === 'email')).toBe(true);
  });

  it('handles quoted commas and exports a round-trippable roster', () => {
    const source = 'name,title,company,email\r\n"Rivera, Alex","Director, Programs",Launch Lab,alex@example.org';
    const variants = variantsFromCsv(source, createStarterDesign());
    expect(variants[0].identity.name).toBe('Rivera, Alex');
    expect(variants[0].identity.title).toBe('Director, Programs');
    expect(variantsFromCsv(variantsToCsv(variants), createStarterDesign())[0].identity.name).toBe('Rivera, Alex');
  });

  it('requires a name column', () => {
    expect(() => variantsFromCsv('email\r\na@example.org', createStarterDesign())).toThrow('name column');
  });
});
