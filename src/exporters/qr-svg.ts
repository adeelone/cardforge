import type { Design, DesignElement } from '../types/design';
import { qrCandidates, firstRenderable } from './qr-value';

function escapeText(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character] ?? character);
}

export async function exportQrSvg(design: Design, selectedElement?: DesignElement) {
  const { default: QRCode } = await import('qrcode');
  const element = selectedElement ?? design.elements.find((item) => item.kind === 'qr') ?? ({ qrMode: 'digital' } as DesignElement);
  const code = await firstRenderable(qrCandidates(element, design), async (value) =>
    QRCode.create(value, { errorCorrectionLevel: design.qrStyle.errorCorrection })
  );
  if (!code) throw new Error('QR content is too large');

  const margin = design.qrStyle.margin;
  const size = code.modules.size;
  const total = size + margin * 2;
  const modules: string[] = [];
  for (let index = 0; index < code.modules.data.length; index += 1) {
    if (!code.modules.data[index]) continue;
    const x = margin + (index % size);
    const y = margin + Math.floor(index / size);
    modules.push(
      design.qrStyle.pattern === 'dots'
        ? `<circle cx="${x + 0.5}" cy="${y + 0.5}" r="0.43" fill="${design.qrStyle.foreground}"/>`
        : `<rect x="${x}" y="${y}" width="1" height="1" rx="${design.qrStyle.pattern === 'rounded' ? 0.28 : 0}" fill="${design.qrStyle.foreground}"/>`
    );
  }
  if (design.qrStyle.centerMark) {
    const markSize = Math.max(5, Math.floor(size * 0.2));
    const markStart = margin + Math.floor((size - markSize) / 2);
    const initial = escapeText((design.identity.company.trim().charAt(0) || design.identity.name.trim().charAt(0) || 'C').toUpperCase());
    modules.push(`<rect x="${markStart - 0.5}" y="${markStart - 0.5}" width="${markSize + 1}" height="${markSize + 1}" rx="${(markSize + 1) / 2}" fill="${design.qrStyle.background}"/>`);
    modules.push(`<circle cx="${total / 2}" cy="${total / 2}" r="${markSize * 0.42}" fill="${design.qrStyle.foreground}"/>`);
    modules.push(`<text x="${total / 2}" y="${total / 2 + markSize * 0.17}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="${markSize * 0.52}" font-weight="700" fill="${design.qrStyle.background}">${initial}</text>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="geometricPrecision"><rect width="${total}" height="${total}" fill="${design.qrStyle.background}"/>${modules.join('')}</svg>`;
}
