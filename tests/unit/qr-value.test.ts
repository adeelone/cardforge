import { describe, expect, it } from 'vitest';
import { createStarterDesign } from '../../src/editor/templates/templates';
import { qrCandidates, qrExternalDestination } from '../../src/exporters/qr-value';

describe('QR destinations', () => {
  it('uses a normalized custom URL as the only QR destination', () => {
    const design = createStarterDesign();
    const element = { ...design.elements.find((item) => item.kind === 'qr')!, qrMode: 'custom' as const, qrUrl: 'example.com/hello' };
    expect(qrCandidates(element, design)).toEqual(['https://example.com/hello']);
  });

  it('accepts LinkedIn hosts and rejects lookalikes', () => {
    const design = createStarterDesign();
    const element = { ...design.elements.find((item) => item.kind === 'qr')!, qrMode: 'linkedin' as const, qrUrl: 'https://www.linkedin.com/in/jordan' };
    expect(qrExternalDestination(element)).toBe('https://www.linkedin.com/in/jordan');
    expect(qrExternalDestination({ ...element, qrUrl: 'https://linkedin.example/in/jordan' })).toBeUndefined();
  });

  it('falls back to the private digital-card payload for invalid external URLs', () => {
    const design = createStarterDesign();
    const element = { ...design.elements.find((item) => item.kind === 'qr')!, qrMode: 'custom' as const, qrUrl: 'javascript:alert(1)' };
    expect(qrCandidates(element, design)[0]).toContain('#d=');
  });
});
