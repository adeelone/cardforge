import { exportSideSvg } from './svg';
import type { CardSide, Design } from '../types/design';
import { canvasDims } from '../lib/units';

export async function exportPng(design: Design, dpi = 300, side: CardSide = 'front') {
  // Ensure self-hosted fonts are ready before rasterizing, or text falls back.
  if ('fonts' in document) {
    try {
      await (document as Document & { fonts: FontFaceSet }).fonts.ready;
    } catch {
      /* fonts API unavailable in test env */
    }
  }
  const { w, h } = canvasDims(design.card);
  const scale = dpi / 96;
  const svg = await exportSideSvg(design, side);
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const image = new Image();
  image.src = url;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas rendering is not available.');
  context.fillStyle = design.theme.surface;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((png) => (png ? resolve(png) : reject(new Error('PNG export failed.'))), 'image/png');
  });
}
