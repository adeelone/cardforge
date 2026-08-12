export type FontCategory = 'Sans' | 'Serif' | 'Mono' | 'Display';

export interface FontDefinition {
  /** Stable display name stored in the design document. */
  name: string;
  /** The actual loaded CSS family (from @fontsource). */
  family: string;
  category: FontCategory;
  /** Generic fallback appended to the stack. */
  fallback: 'sans-serif' | 'serif' | 'monospace';
}

/**
 * Every font here is self-hosted via @fontsource (see styles/fonts.css) so the
 * canvas, exports, and PWA all render the true typeface offline. The design
 * model stores the portable `name`; `fontStack()` resolves it to real CSS.
 */
export const FONTS: FontDefinition[] = [
  { name: 'Inter', family: 'Inter Variable', category: 'Sans', fallback: 'sans-serif' },
  { name: 'Geist', family: 'Geist Sans', category: 'Sans', fallback: 'sans-serif' },
  { name: 'Manrope', family: 'Manrope Variable', category: 'Sans', fallback: 'sans-serif' },
  { name: 'Space Grotesk', family: 'Space Grotesk Variable', category: 'Sans', fallback: 'sans-serif' },
  { name: 'IBM Plex Sans', family: 'IBM Plex Sans', category: 'Sans', fallback: 'sans-serif' },
  { name: 'Fraunces', family: 'Fraunces Variable', category: 'Serif', fallback: 'serif' },
  { name: 'Playfair Display', family: 'Playfair Display Variable', category: 'Serif', fallback: 'serif' },
  { name: 'JetBrains Mono', family: 'JetBrains Mono Variable', category: 'Mono', fallback: 'monospace' },
  { name: 'IBM Plex Mono', family: 'IBM Plex Mono', category: 'Mono', fallback: 'monospace' },
  { name: 'Bebas Neue', family: 'Bebas Neue', category: 'Display', fallback: 'sans-serif' }
];

const FONT_BY_NAME = new Map(FONTS.map((font) => [font.name, font]));

export const FONT_OPTIONS = FONTS.map((font) => font.name);

/** Resolve a stored display name to a full CSS font-family stack. */
export function fontStack(name: string | undefined): string {
  const def = name ? FONT_BY_NAME.get(name) : undefined;
  if (!def) return "'Inter Variable', ui-sans-serif, system-ui, sans-serif";
  const generic =
    def.fallback === 'serif'
      ? 'ui-serif, Georgia,'
      : def.fallback === 'monospace'
        ? 'ui-monospace, SFMono-Regular,'
        : 'ui-sans-serif, system-ui,';
  return `'${def.family}', ${generic} ${def.fallback}`;
}

export function fontCategory(name: string | undefined): FontCategory {
  return (name ? FONT_BY_NAME.get(name)?.category : undefined) ?? 'Sans';
}

/** Curated heading -> body pairings for one-click typographic harmony. */
export const FONT_PAIRINGS: Record<string, string> = {
  Inter: 'IBM Plex Sans',
  Geist: 'Manrope',
  Manrope: 'Inter',
  'Space Grotesk': 'Inter',
  'IBM Plex Sans': 'IBM Plex Mono',
  Fraunces: 'Inter',
  'Playfair Display': 'Manrope',
  'JetBrains Mono': 'Inter',
  'IBM Plex Mono': 'IBM Plex Sans',
  'Bebas Neue': 'Inter'
};
