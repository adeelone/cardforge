import { colord } from 'colord';

function channel(value: number) {
  const v = value / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

export function contrastRatio(foreground: string, background: string) {
  const fg = colord(foreground).toRgb();
  const bg = colord(background).toRgb();
  const l1 = 0.2126 * channel(fg.r) + 0.7152 * channel(fg.g) + 0.0722 * channel(fg.b);
  const l2 = 0.2126 * channel(bg.r) + 0.7152 * channel(bg.g) + 0.0722 * channel(bg.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function passesAA(foreground: string, background: string, largeText = false) {
  return contrastRatio(foreground, background) >= (largeText ? 3 : 4.5);
}

export function paletteFromSeed(seed: string) {
  const base = colord(seed);
  return [
    base.lighten(0.32).toHex(),
    base.lighten(0.16).toHex(),
    base.toHex(),
    base.darken(0.16).toHex(),
    base.darken(0.32).toHex()
  ];
}
