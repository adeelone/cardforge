import { describe, expect, it } from 'vitest';
import { createStarterDesign } from '../../src/editor/templates/templates';
import { exportPdf } from '../../src/exporters/pdf';

describe('PDF exporter', () => {
  it('exports a two-page print PDF', async () => {
    const pdf = await exportPdf(createStarterDesign());
    expect(pdf.type).toBe('application/pdf');
    expect(pdf.size).toBeGreaterThan(1000);
  });
});
