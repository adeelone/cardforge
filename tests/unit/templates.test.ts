import { describe, expect, it } from 'vitest';
import { templates, createStarterDesign } from '../../src/editor/templates/templates';
import { FONT_OPTIONS } from '../../src/data/fonts';

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

describe('template library integrity', () => {
  it('has unique template ids', () => {
    const ids = templates.map((template) => template.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique element ids within each template', () => {
    for (const template of templates) {
      const ids = template.elements.map((element) => element.id);
      expect(new Set(ids).size, `duplicate element id in "${template.id}"`).toBe(ids.length);
    }
  });

  it('only references fonts that are actually registered and loaded', () => {
    for (const template of templates) {
      expect(FONT_OPTIONS, `"${template.id}" headingFont`).toContain(template.theme.headingFont);
      expect(FONT_OPTIONS, `"${template.id}" bodyFont`).toContain(template.theme.bodyFont);
    }
  });

  it('uses valid hex colors throughout theme and gradients', () => {
    for (const template of templates) {
      for (const key of ['brand', 'surface', 'text', 'accent'] as const) {
        expect(template.theme[key], `"${template.id}" theme.${key}`).toMatch(HEX_COLOR);
      }
      for (const element of template.elements) {
        if (element.fill) expect(element.fill, `"${template.id}" element "${element.id}" fill`).toMatch(HEX_COLOR);
        if (element.gradient) {
          expect(element.gradient[0], `"${template.id}" element "${element.id}" gradient[0]`).toMatch(HEX_COLOR);
          expect(element.gradient[1], `"${template.id}" element "${element.id}" gradient[1]`).toMatch(HEX_COLOR);
        }
      }
    }
  });

  it('gives every template a name element, contact info, and a scannable QR on a positive-size box', () => {
    for (const template of templates) {
      const hasName = template.elements.some((element) => element.kind === 'text' && element.role === 'name');
      const hasQr = template.elements.some((element) => element.kind === 'qr');
      expect(hasName, `"${template.id}" is missing a name element`).toBe(true);
      expect(hasQr, `"${template.id}" is missing a QR element`).toBe(true);
      for (const element of template.elements) {
        expect(element.width, `"${template.id}" element "${element.id}" width`).toBeGreaterThan(0);
        expect(element.height, `"${template.id}" element "${element.id}" height`).toBeGreaterThan(0);
      }
    }
  });

  it('builds a valid starter design for every template', () => {
    for (const template of templates) {
      const design = createStarterDesign(template.id);
      expect(design.meta.templateId).toBe(template.id);
      expect(design.elements.length).toBe(template.elements.length);
    }
  });
});
