import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { CardSide, Design, DesignElement } from '../types/design';
import { interpolateText } from '../editor/canvas/render-text';

const PT_PER_MM = 72 / 25.4;

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized.length === 3 ? normalized.split('').map((char) => char + char).join('') : normalized, 16);
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

function drawSide(doc: PDFDocument, design: Design, side: CardSide, font: import('pdf-lib').PDFFont, bold: import('pdf-lib').PDFFont) {
  const bleed = design.card.bleedMm * PT_PER_MM;
  const width = design.card.widthMm * PT_PER_MM + bleed * 2;
  const height = design.card.heightMm * PT_PER_MM + bleed * 2;
  const page = doc.addPage([width, height]);
  page.drawRectangle({ x: 0, y: 0, width, height, color: hexToRgb(design.theme.surface) });
  page.setBleedBox(0, 0, width, height);
  page.setTrimBox(bleed, bleed, width - bleed * 2, height - bleed * 2);
  const scaleX = (width - bleed * 2) / 336;
  const scaleY = (height - bleed * 2) / 192;

  const elements = design.elements.filter((element) => element.side === side && !element.hidden).sort((a, b) => a.z - b.z);
  for (const element of elements) {
    const x = bleed + element.x * scaleX;
    const y = height - bleed - (element.y + element.height) * scaleY;
    if (element.kind === 'shape') {
      page.drawRectangle({
        x,
        y,
        width: element.width * scaleX,
        height: element.height * scaleY,
        color: hexToRgb(element.fill ?? design.theme.brand)
      });
    }
    if (element.kind === 'text') drawPdfText(page, design, element, x, y, scaleY, font, bold);
    if (element.kind === 'qr') {
      page.drawRectangle({ x, y, width: element.width * scaleX, height: element.height * scaleY, borderColor: hexToRgb(design.theme.text), borderWidth: 0.75 });
      page.drawText('QR', { x: x + 8, y: y + element.height * scaleY / 2 - 4, size: 8, font, color: hexToRgb(design.theme.text) });
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
  scale: number,
  font: import('pdf-lib').PDFFont,
  bold: import('pdf-lib').PDFFont
) {
  const size = (element.fontSize ?? 10) * design.theme.typeScale * scale;
  const lines = interpolateText(element.text ?? '', design).split('\n');
  lines.forEach((line, index) => {
    page.drawText(line, {
      x,
      y: y + element.height * scale - size - index * size * design.theme.lineHeight,
      size,
      font: element.id === 'name' ? bold : font,
      color: hexToRgb(element.fill ?? design.theme.text),
      maxWidth: element.width * scale
    });
  });
}

export async function exportPdf(design: Design) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  drawSide(doc, design, 'front', font, bold);
  drawSide(doc, design, 'back', font, bold);
  const bytes = await doc.save();
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Blob([buffer], { type: 'application/pdf' });
}
