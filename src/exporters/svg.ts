import type { CardSide, Design, DesignElement } from '../types/design';
import { layoutText, alignToAnchor, anchorX } from '../editor/canvas/render-text';
import { fontStack } from '../data/fonts';
import { canvasDims } from '../lib/units';
import { exportQrSvg } from './qr-svg';

function escapeXml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function attrs(values: Record<string, string | number | undefined>) {
  return Object.entries(values)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}="${escapeXml(String(value))}"`)
    .join(' ');
}

function textElement(element: DesignElement, design: Design) {
  const { lines, fontSize, fontFamily, fontWeight, align, letterSpacing } = layoutText(element, design);
  const x = anchorX(align, element.width);
  const tspans = lines
    .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? fontSize : fontSize * design.theme.lineHeight}">${escapeXml(line)}</tspan>`)
    .join('');
  return `<text ${attrs({
    fill: element.fill ?? design.theme.text,
    'font-family': fontStack(fontFamily),
    'font-size': fontSize,
    'font-weight': fontWeight,
    'letter-spacing': letterSpacing || undefined,
    'text-anchor': alignToAnchor(align),
    opacity: element.opacity
  })}>${tspans}</text>`;
}

function shapeElement(element: DesignElement, design: Design) {
  const shape = element.shape ?? 'rect';
  const gradientId = element.gradient ? `grad-${element.id}` : undefined;
  const fill = gradientId ? `url(#${gradientId})` : element.fill ?? design.theme.brand;
  const defs = element.gradient
    ? `<defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${escapeXml(element.gradient[0])}"/><stop offset="100%" stop-color="${escapeXml(element.gradient[1])}"/></linearGradient></defs>`
    : '';
  if (shape === 'ellipse') {
    return `${defs}<ellipse ${attrs({ cx: element.width / 2, cy: element.height / 2, rx: element.width / 2, ry: element.height / 2, fill, stroke: element.stroke, 'stroke-width': element.strokeWidth, opacity: element.opacity })}/>`;
  }
  if (shape === 'line') {
    return `<line ${attrs({ x1: 0, y1: element.height / 2, x2: element.width, y2: element.height / 2, stroke: element.stroke ?? fill, 'stroke-width': element.strokeWidth ?? Math.max(1, element.height), 'stroke-linecap': 'round', opacity: element.opacity })}/>`;
  }
  return `${defs}<rect ${attrs({ width: element.width, height: element.height, rx: element.radius ?? Math.min(8, design.card.cornerRadius), fill, stroke: element.stroke, 'stroke-width': element.strokeWidth, opacity: element.opacity })}/>`;
}

async function elementMarkup(element: DesignElement, design: Design) {
  if (element.kind === 'shape') return shapeElement(element, design);
  if (element.kind === 'text') return textElement(element, design);
  if (element.kind === 'image') {
    const asset = design.assets.find((item) => item.id === element.assetId);
    if (!asset) return `<rect ${attrs({ width: element.width, height: element.height, fill: 'transparent', stroke: design.theme.accent, 'stroke-dasharray': '4 4' })}/>`;
    const clipId = `clip-${element.id}`;
    return `<defs><clipPath id="${clipId}"><rect ${attrs({ width: element.width, height: element.height, rx: element.radius ?? 0 })}/></clipPath></defs><image ${attrs({ href: asset.dataUrl, width: element.width, height: element.height, preserveAspectRatio: 'xMidYMid slice', 'clip-path': `url(#${clipId})`, opacity: element.opacity })}/>`;
  }
  if (element.kind === 'qr') {
    const svg = await exportQrSvg(design, element);
    const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
    const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 25 25';
    return `<svg ${attrs({ width: element.width, height: element.height, viewBox, opacity: element.opacity })}>${svg.replace(/<\?xml.*?\?>|<svg[^>]*>|<\/svg>/g, '')}</svg>`;
  }
  return '';
}

export async function exportSideSvg(design: Design, side: CardSide) {
  const { w, h } = canvasDims(design.card);
  const safeInset = design.card.bleedMm * 3.78 + 9;
  const elements = await Promise.all(
    design.elements
      .filter((element) => element.side === side && !element.hidden)
      .sort((a, b) => a.z - b.z)
      .map(
        async (element) =>
          `<g ${attrs({ transform: `translate(${element.x} ${element.y}) rotate(${element.rotation} ${element.width / 2} ${element.height / 2})` })}>${await elementMarkup(element, design)}</g>`
      )
  );
  const safeArea = design.card.safeAreaVisible
    ? `<rect ${attrs({ x: safeInset, y: safeInset, width: w - safeInset * 2, height: h - safeInset * 2, fill: 'none', stroke: design.theme.accent, 'stroke-dasharray': '5 4', opacity: 0.32 })}/>`
    : '';
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(`${side} side of ${design.meta.name}`)}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" rx="${design.card.cornerRadius}" fill="${escapeXml(design.theme.surface)}"/>${safeArea}${elements.join('')}</svg>`;
}

export async function exportSvgBundle(design: Design) {
  const { w, h } = canvasDims(design.card);
  const gap = 28;
  const front = (await exportSideSvg(design, 'front')).replace(/<\?xml.*?\?>/, '');
  const back = (await exportSideSvg(design, 'back')).replace(/<\?xml.*?\?>/, '');
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w * 2 + gap} ${h}"><g transform="translate(0 0)">${front}</g><g transform="translate(${w + gap} 0)">${back}</g></svg>`;
}
