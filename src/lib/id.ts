function randomToken() {
  // Ids also key cloud rows, so prefer a CSPRNG over Math.random.
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    return Array.from(bytes, (byte) => byte.toString(36).padStart(2, '0')).join('').slice(0, 12);
  }
  return Math.random().toString(36).slice(2, 10);
}

export function createId(prefix = 'id') {
  return `${prefix}_${randomToken()}_${Date.now().toString(36)}`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/**
 * Element/design ids are only type- and length-checked on import
 * (normalizeDesign), not charset-restricted, so a crafted `.cardforge.json`
 * or share link can carry arbitrary characters in an id. Use this wherever
 * an id becomes part of an SVG `id`/`url(#fragment)` reference — as a raw
 * string in exported markup it's an XML-injection risk, and even in React
 * (which is safe from injection) stray characters can break the fragment
 * match and silently drop a gradient or clip path.
 */
export function safeElementId(id: string) {
  return id.replace(/[^a-zA-Z0-9_-]/g, '') || 'el';
}
