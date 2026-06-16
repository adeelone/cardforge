import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { Design } from '../types/design';

export function encodeSharePayload(design: Design) {
  return compressToEncodedURIComponent(JSON.stringify(design));
}

export function decodeSharePayload(payload: string): Design | null {
  try {
    const text = decompressFromEncodedURIComponent(payload);
    return text ? (JSON.parse(text) as Design) : null;
  } catch {
    return null;
  }
}
