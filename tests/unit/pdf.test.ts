import { describe, expect, it } from 'vitest';
import { createStarterDesign } from '../../src/editor/templates/templates';
import { exportPdf, exportRosterPdf } from '../../src/exporters/pdf';

describe('PDF exporter', () => {
  it('exports a two-page print PDF', async () => {
    const pdf = await exportPdf(createStarterDesign());
    expect(pdf.type).toBe('application/pdf');
    expect(pdf.size).toBeGreaterThan(1000);
  });

  it('creates a multi-person roster PDF', async () => {
    const design = createStarterDesign('campus');
    design.variants.push({ ...design.variants[0], id: 'second', name: 'Second person', identity: { ...design.identity, name: 'Jordan Lee' } });
    const pdf = await exportRosterPdf(design);
    expect(pdf.type).toBe('application/pdf');
    expect(pdf.size).toBeGreaterThan(1500);
  });
});
