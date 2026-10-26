import type { Design, DesignElement } from '../types/design';
import { createVCard } from './vcard';
import { buildShareUrl, hostedCardUrl, shareBase } from './share-link';
import { safeExternalHref } from '../lib/design-security';

export function qrExternalDestination(element: DesignElement): string | undefined {
  if (element.qrMode !== 'linkedin' && element.qrMode !== 'custom') return undefined;
  const destination = safeExternalHref(element.qrUrl ?? '');
  if (!destination) return undefined;
  if (element.qrMode === 'linkedin') {
    const hostname = new URL(destination).hostname.toLowerCase();
    if (hostname !== 'linkedin.com' && !hostname.endsWith('.linkedin.com')) return undefined;
  }
  return destination;
}

/**
 * QR content, in priority order. A serverless digital card must embed its whole
 * payload in the URL, which can exceed QR capacity — so we degrade gracefully:
 * full link -> link without heavy image assets -> vCard -> short link.
 */
export function qrCandidates(element: DesignElement, design: Design): string[] {
  const shortLink = `${shareBase()}/c/${design.meta.slug}`;
  if (element.qrMode === 'vcard') return [createVCard(design), shortLink];
  if (element.qrMode === 'url') return [`${shareBase()}/design/${design.meta.id}`];
  if (element.qrMode === 'linkedin' || element.qrMode === 'custom') {
    const destination = qrExternalDestination(element);
    if (destination) return [destination];
  }
  // A hosted card is a short, revocable URL — the best possible QR payload.
  const hosted = design.meta.publishedSlug ? [hostedCardUrl(design.meta.publishedSlug)] : [];
  return [...hosted, buildShareUrl(design), buildShareUrl(design, { stripAssets: true }), createVCard(design), shortLink];
}

/** Try each candidate until one renders within QR capacity; returns null if all fail. */
export async function firstRenderable<T>(candidates: string[], render: (value: string) => Promise<T>): Promise<T | null> {
  for (const value of candidates) {
    try {
      return await render(value);
    } catch {
      /* too large or invalid — try the next, lighter candidate */
    }
  }
  return null;
}
