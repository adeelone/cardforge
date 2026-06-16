import type { Design } from '../../types/design';

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
