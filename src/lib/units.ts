import type { CardPreset, Orientation } from '../types/design';

export const MM_PER_IN = 25.4;
export const PX_PER_MM = 96 / MM_PER_IN;

export const CARD_PRESETS: Record<CardPreset, { label: string; widthMm: number; heightMm: number }> = {
  us: { label: 'US 3.5 x 2 in', widthMm: 88.9, heightMm: 50.8 },
  eu: { label: 'EU 85 x 55 mm', widthMm: 85, heightMm: 55 },
  jp: { label: 'JP 91 x 55 mm', widthMm: 91, heightMm: 55 },
  uk: { label: 'UK 85 x 55 mm', widthMm: 85, heightMm: 55 },
  square: { label: 'Square 65 x 65 mm', widthMm: 65, heightMm: 65 },
  mini: { label: 'Mini 70 x 28 mm', widthMm: 70, heightMm: 28 }
};

export function presetSize(preset: CardPreset, orientation: Orientation) {
  const spec = CARD_PRESETS[preset];
  if (orientation === 'portrait') return { widthMm: spec.heightMm, heightMm: spec.widthMm };
  return { widthMm: spec.widthMm, heightMm: spec.heightMm };
}

export function mmToPx(mm: number) {
  return mm * PX_PER_MM;
}

/** Fixed width of the internal design coordinate space, in canvas units. */
export const CANVAS_BASE_W = 336;

/**
 * The canvas/export coordinate space. Width is fixed; height tracks the card's
 * true aspect ratio so square, portrait, and mini cards render correctly
 * instead of being forced into a 1.75:1 landscape box.
 */
export function canvasDims(card: { widthMm: number; heightMm: number }) {
  const w = CANVAS_BASE_W;
  const h = Math.round((CANVAS_BASE_W * card.heightMm) / card.widthMm);
  return { w, h };
}

export function formatDimensions(widthMm: number, heightMm: number, units: 'mm' | 'in') {
  if (units === 'in') {
    const w = (widthMm / MM_PER_IN).toFixed(2);
    const h = (heightMm / MM_PER_IN).toFixed(2);
    return `${w} × ${h} in`;
  }
  return `${Math.round(widthMm * 10) / 10} × ${Math.round(heightMm * 10) / 10} mm`;
}
