import type { Alignment, Design, DesignElement } from '../../types/design';
import { fontCategory } from '../../data/fonts';

export function interpolateText(value: string, design: Design) {
  const contactLines = design.contacts
    .filter((item) => item.value.trim())
    .map((item) => `${item.label}: ${item.value}`)
    .join('\n');
  return value
    .replaceAll('{name}', design.identity.name)
    .replaceAll('{title}', design.identity.title)
    .replaceAll('{company}', design.identity.company)
    .replaceAll('{department}', design.identity.department)
    .replaceAll('{tagline}', design.identity.tagline)
    .replaceAll('{pronouns}', design.identity.pronouns)
    .replaceAll('{contacts}', contactLines);
}

export function balancedLines(value: string, max = 24) {
  if (value.includes('\n') || value.length <= max) return value.split('\n');
  const words = value.split(' ');
  const midpoint = value.length / 2;
  let best = 1;
  let cursor = 0;
  for (let index = 0; index < words.length - 1; index += 1) {
    cursor += words[index].length + 1;
    if (Math.abs(cursor - midpoint) < Math.abs(words.slice(0, best).join(' ').length - midpoint)) best = index + 1;
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}

/** Greedy word-wrap to a max character count per line, preserving explicit newlines. */
export function wrapLines(value: string, maxChars: number) {
  const out: string[] = [];
  for (const paragraph of value.split('\n')) {
    if (!paragraph.trim()) {
      out.push('');
      continue;
    }
    let line = '';
    for (const word of paragraph.split(' ')) {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length > maxChars && line) {
        out.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

/** Approximate glyph advance as a fraction of the font size, per font category. */
function advanceRatio(fontFamily: string | undefined, isName: boolean) {
  const category = fontCategory(fontFamily);
  if (category === 'Mono') return 0.62;
  if (category === 'Display') return 0.44;
  return isName ? 0.56 : 0.52;
}

export interface TextLayout {
  lines: string[];
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  align: Alignment;
  letterSpacing: number;
}

/** Single source of truth for how a text element lays out, shared by canvas + exporters. */
export function layoutText(element: DesignElement, design: Design): TextLayout {
  const value = interpolateText(element.text ?? '', design);
  const isName = element.role === 'name';
  const fontSize = (element.fontSize ?? 12) * design.theme.typeScale;
  const fontFamily = element.fontFamily ?? (isName ? design.theme.headingFont : design.theme.bodyFont);
  const fontWeight = element.fontWeight ?? (isName ? design.theme.weight : 500);
  const align = element.align ?? design.card.alignment ?? 'left';
  const letterSpacing = element.letterSpacing ?? design.theme.letterSpacing;
  const maxChars = Math.max(4, Math.floor(element.width / (fontSize * advanceRatio(fontFamily, isName))));
  const lines = isName ? balancedLines(value, Math.min(maxChars, 22)) : wrapLines(value, maxChars);
  return { lines, fontSize, fontFamily, fontWeight, align, letterSpacing };
}

export function alignToAnchor(align: Alignment): 'start' | 'middle' | 'end' {
  if (align === 'center') return 'middle';
  if (align === 'right') return 'end';
  return 'start';
}

export function anchorX(align: Alignment, width: number) {
  if (align === 'center') return width / 2;
  if (align === 'right') return width;
  return 0;
}
