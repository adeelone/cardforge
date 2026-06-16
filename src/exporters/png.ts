import { exportSideSvg } from './svg';
import type { Design } from '../types/design';

export async function exportPng(design: Design, dpi = 300) {
  const scale = dpi / 96;
  const svg = exportSideSvg(design, 'front');
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const image = new Image();
  image.src = url;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(336 * scale);
  canvas.height = Math.round(192 * scale);
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
