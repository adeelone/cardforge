import QRCode from 'qrcode';
import type { CardSide, Design, DesignElement } from '../types/design';
import { interpolateText, balancedLines } from '../editor/canvas/render-text';
import { createVCard } from './vcard';
import { encodeSharePayload } from './share-link';

function escapeXml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function attrs(values: Record<string, string | number | undefined>) {
  return Object.entries(values)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}="${escapeXml(String(value))}"`)
    .join(' ');
}

function qrValue(element: DesignElement, design: Design) {
  if (element.qrMode === 'vcard') return createVCard(design);
  if (element.qrMode === 'url') return `/design/${design.meta.id}`;
  return `/c/${design.meta.slug}?d=${encodeSharePayload(design)}`;
}

function textElement(element: DesignElement, design: Design) {
  const value = interpolateText(element.text ?? '', design);
  const lines = element.id === 'name' ? balancedLines(value, 20) : value.split('\n');
  const fontSize = (element.fontSize ?? 12) * design.theme.typeScale;
  const family = element.fontFamily ?? (element.id === 'name' ? design.theme.headingFont : design.theme.bodyFont);
  const tspans = lines
    .map((line, index) => `<tspan x="0" dy="${index === 0 ? fontSize : fontSize * design.theme.lineHeight}">${escapeXml(line)}</tspan>`)
    .join('');
  return `<text ${attrs({ fill: element.fill ?? design.theme.text, 'font-family': family, 'font-size': fontSize, 'font-weight': element.id === 'name' ? design.theme.weight : 500, 'letter-spacing': design.theme.letterSpacing })}>${tspans}</text>`;
}

async function elementMarkup(element: DesignElement, design: Design) {
  if (element.kind === 'shape') {
    const isDot = element.width === element.height && element.width <= 20;
    return `<rect ${attrs({ width: element.width, height: element.height, rx: isDot ? element.width / 2 : Math.min(8, design.card.cornerRadius), fill: element.fill ?? design.theme.brand, stroke: element.stroke })}/>`;
  }
  if (element.kind === 'text') return textElement(element, design);
  if (element.kind === 'image') {
    const asset = design.assets.find((item) => item.id === element.assetId);
    if (!asset) return `<rect ${attrs({ width: element.width, height: element.height, fill: 'transparent', stroke: design.theme.accent, 'stroke-dasharray': '4 4' })}/>`;
    return `<image ${attrs({ href: asset.dataUrl, width: element.width, height: element.height, preserveAspectRatio: 'xMidYMid slice' })}/>`;
  }
  if (element.kind === 'qr') {
    const svg = await QRCode.toString(qrValue(element, design), {
      type: 'svg',
      margin: 1,
      color: { dark: design.theme.text, light: '#00000000' }
    });
    return `<svg ${attrs({ width: element.width, height: element.height, viewBox: '0 0 25 25' })}>${svg.replace(/<\?xml.*?\?>|<svg[^>]*>|<\/svg>/g, '')}</svg>`;
  }
  return '';
}

export async function exportSideSvg(design: Design, side: CardSide) {
  const safeInset = design.card.bleedMm * 3.78 + 9;
  const elements = await Promise.all(
    design.elements
      .filter((element) => element.side === side && !element.hidden)
      .sort((a, b) => a.z - b.z)
      .map(async (element) => `<g ${attrs({ transform: `translate(${element.x} ${element.y}) rotate(${element.rotation})` })}>${await elementMarkup(element, design)}</g>`)
  );
  const safeArea = design.card.safeAreaVisible
    ? `<rect ${attrs({ x: safeInset, y: safeInset, width: 336 - safeInset * 2, height: 192 - safeInset * 2, fill: 'none', stroke: design.theme.accent, 'stroke-dasharray': '5 4', opacity: 0.32 })}/>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(`${side} side of ${design.meta.name}`)}" viewBox="0 0 336 192"><rect width="336" height="192" rx="${design.card.cornerRadius}" fill="${escapeXml(design.theme.surface)}"/>${safeArea}${elements.join('')}</svg>`;
}

export async function exportSvgBundle(design: Design) {
  const front = (await exportSideSvg(design, 'front')).replace(/<\?xml.*?\?>/, '');
  const back = (await exportSideSvg(design, 'back')).replace(/<\?xml.*?\?>/, '');
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 220"><g transform="translate(0 0)">${front}</g><g transform="translate(364 0)">${back}</g></svg>`;
}
