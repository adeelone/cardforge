import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { Design } from '../types/design';

export function encodeSharePayload(design: Design) {
  return compressToEncodedURIComponent(JSON.stringify(design));
}

export function decodeSharePayload(payload: string): Design | null {
  try {
    // URLSearchParams turns '+' into ' '. The lz-string alphabet never contains
    // spaces, so any space must have been a '+' — restore it before decoding.
    const normalized = payload.replaceAll(' ', '+');
    const text = decompressFromEncodedURIComponent(normalized);
    return text ? (JSON.parse(text) as Design) : null;
  } catch {
    return null;
  }
}

/** Origin + base path for the deployed app (works under GitHub Pages subpaths). */
export function shareBase() {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cardforge.app';
  return `${origin}${base}`;
}

/** Build a shareable digital-card URL. The payload is percent-encoded so '+'
 *  survives URLSearchParams round-trips. */
export function buildShareUrl(design: Design, opts?: { stripAssets?: boolean }): string {
  const payloadDesign = opts?.stripAssets ? { ...design, assets: [] } : design;
  return `${shareBase()}/c/${design.meta.slug}?d=${encodeURIComponent(encodeSharePayload(payloadDesign))}`;
}
