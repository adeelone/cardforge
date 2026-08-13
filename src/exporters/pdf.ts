import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import type { CardSide, Design, DesignElement } from '../types/design';
import { layoutText } from '../editor/canvas/render-text';
import { canvasDims } from '../lib/units';
import { firstRenderable, qrCandidates } from './qr-value';

const PT_PER_MM = 72 / 25.4;

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(
    normalized.length === 3 ? normalized.split('').map((char) => char + char).join('') : normalized.slice(0, 6),
    16
  );
  return rgb(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255);
}

function drawCropMarks(page: import('pdf-lib').PDFPage, bleed: number, width: number, height: number) {
  const mark = 12;
  const gap = 4;
  const color = rgb(0, 0, 0);
  const points = [
    [bleed - gap - mark, bleed, bleed - gap, bleed],
    [bleed, bleed - gap - mark, bleed, bleed - gap],
    [width - bleed + gap, bleed, width - bleed + gap + mark, bleed],
    [width - bleed, bleed - gap - mark, width - bleed, bleed - gap],
    [bleed - gap - mark, height - bleed, bleed - gap, height - bleed],
    [bleed, height - bleed + gap, bleed, height - bleed + gap + mark],
    [width - bleed + gap, height - bleed, width - bleed + gap + mark, height - bleed],
    [width - bleed, height - bleed + gap, width - bleed, height - bleed + gap + mark]
  ];
  for (const [x1, y1, x2, y2] of points) page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 0.35, color });
}

async function embedAsset(doc: PDFDocument, dataUrl: string) {
  if (dataUrl.startsWith('data:image/png')) return doc.embedPng(dataUrl);
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return doc.embedJpg(dataUrl);
  return null;
}

async function drawSide(
  doc: PDFDocument,
  design: Design,
  side: CardSide,
  font: import('pdf-lib').PDFFont,
  bold: import('pdf-lib').PDFFont
) {
  const { w: baseW, h: baseH } = canvasDims(design.card);
  const bleed = design.card.bleedMm * PT_PER_MM;
  const width = design.card.widthMm * PT_PER_MM + bleed * 2;
  const height = design.card.heightMm * PT_PER_MM + bleed * 2;
  const page = doc.addPage([width, height]);
  page.drawRectangle({ x: 0, y: 0, width, height, color: hexToRgb(design.theme.surface) });
  page.setBleedBox(0, 0, width, height);
  page.setTrimBox(bleed, bleed, width - bleed * 2, height - bleed * 2);
  const scaleX = (width - bleed * 2) / baseW;
  const scaleY = (height - bleed * 2) / baseH;

  const elements = design.elements.filter((element) => element.side === side && !element.hidden).sort((a, b) => a.z - b.z);
  for (const element of elements) {
    const x = bleed + element.x * scaleX;
    const y = height - bleed - (element.y + element.height) * scaleY;
    const ew = element.width * scaleX;
    const eh = element.height * scaleY;
    const opacity = element.opacity ?? 1;
    if (element.kind === 'shape') {
      const shape = element.shape ?? 'rect';
      const color = hexToRgb(element.gradient ? element.gradient[0] : element.fill ?? design.theme.brand);
      if (shape === 'ellipse') {
        page.drawEllipse({ x: x + ew / 2, y: y + eh / 2, xScale: ew / 2, yScale: eh / 2, color, opacity });
      } else if (shape === 'line') {
        page.drawLine({
          start: { x, y: y + eh / 2 },
          end: { x: x + ew, y: y + eh / 2 },
          thickness: (element.strokeWidth ?? element.height) * scaleY,
          color: hexToRgb(element.stroke ?? element.fill ?? design.theme.brand),
          opacity
        });
      } else {
        page.drawRectangle({ x, y, width: ew, height: eh, color, opacity });
      }
    }
    if (element.kind === 'text') drawPdfText(page, design, element, x, y, scaleX, scaleY, font, bold);
    if (element.kind === 'image') {
      const asset = design.assets.find((item) => item.id === element.assetId);
      const embedded = asset ? await embedAsset(doc, asset.dataUrl) : null;
      if (embedded) page.drawImage(embedded, { x, y, width: ew, height: eh, opacity });
    }
    if (element.kind === 'qr') {
      const code = await firstRenderable(qrCandidates(element, design), async (value) =>
        QRCode.create(value, { errorCorrectionLevel: design.qrStyle.errorCorrection })
      );
      if (!code) continue;
      const margin = design.qrStyle.margin;
      const total = code.modules.size + margin * 2;
      const module = Math.min(ew, eh) / total;
      const qrWidth = module * total;
      const qrX = x + (ew - qrWidth) / 2;
      const qrY = y + (eh - qrWidth) / 2;
      const foreground = hexToRgb(design.qrStyle.foreground);
      const background = hexToRgb(design.qrStyle.background);
      page.drawRectangle({ x: qrX, y: qrY, width: qrWidth, height: qrWidth, color: background, opacity });
      for (let index = 0; index < code.modules.data.length; index += 1) {
        if (!code.modules.data[index]) continue;
        const column = index % code.modules.size;
        const row = Math.floor(index / code.modules.size);
        const mx = qrX + (margin + column) * module;
        const my = qrY + (margin + code.modules.size - row - 1) * module;
        if (design.qrStyle.pattern === 'dots') {
          page.drawCircle({ x: mx + module / 2, y: my + module / 2, size: module * 0.43, color: foreground, opacity });
        } else {
          const inset = design.qrStyle.pattern === 'rounded' ? module * 0.08 : 0;
          page.drawRectangle({ x: mx + inset, y: my + inset, width: module - inset * 2, height: module - inset * 2, color: foreground, opacity });
        }
      }
      if (design.qrStyle.centerMark) {
        const mark = module * Math.max(5, Math.floor(code.modules.size * 0.2));
        const cx = qrX + qrWidth / 2;
        const cy = qrY + qrWidth / 2;
        page.drawCircle({ x: cx, y: cy, size: mark * 0.58, color: background, opacity });
        page.drawCircle({ x: cx, y: cy, size: mark * 0.43, color: foreground, opacity });
        const initial = (design.identity.company.trim().charAt(0) || design.identity.name.trim().charAt(0) || 'C').toUpperCase();
        const initialSize = mark * 0.52;
        page.drawText(initial, { x: cx - bold.widthOfTextAtSize(initial, initialSize) / 2, y: cy - initialSize * 0.34, size: initialSize, font: bold, color: background, opacity });
      }
    }
  }
  drawCropMarks(page, bleed, width, height);
}

function drawPdfText(
  page: import('pdf-lib').PDFPage,
  design: Design,
  element: DesignElement,
  x: number,
  y: number,
  scaleX: number,
  scaleY: number,
  font: import('pdf-lib').PDFFont,
  bold: import('pdf-lib').PDFFont
) {
  const layout = layoutText(element, design);
  const size = layout.fontSize * scaleY;
  const useBold = layout.fontWeight >= 600;
  const pdfFont = useBold ? bold : font;
  const boxWidth = element.width * scaleX;
  const top = y + element.height * scaleY;
  layout.lines.forEach((line, index) => {
    const lineWidth = pdfFont.widthOfTextAtSize(line, size);
    let offsetX = 0;
    if (layout.align === 'center') offsetX = Math.max(0, (boxWidth - lineWidth) / 2);
    else if (layout.align === 'right') offsetX = Math.max(0, boxWidth - lineWidth);
    page.drawText(line, {
      x: x + offsetX,
      y: top - size - index * size * design.theme.lineHeight,
      size,
      font: pdfFont,
      color: hexToRgb(element.fill ?? design.theme.text),
      opacity: element.opacity ?? 1
    });
  });
}

export async function exportPdf(design: Design) {
  return exportDesignsPdf([design]);
}

async function exportDesignsPdf(designs: Design[]) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  for (const design of designs) {
    await drawSide(doc, design, 'front', font, bold);
    await drawSide(doc, design, 'back', font, bold);
  }
  const bytes = await doc.save();
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Blob([buffer], { type: 'application/pdf' });
}

export async function exportRosterPdf(design: Design) {
  if (!design.variants.length) throw new Error('No roster variants to export');
  const designs = design.variants.map((variant) => ({ ...design, identity: variant.identity, contacts: variant.contacts }));
  return exportDesignsPdf(designs);
}
