import { useEffect, useState } from 'react';
import type { DesignElement, Design } from '../../types/design';
import { qrCandidates, firstRenderable } from '../../exporters/qr-value';

interface QrMatrix {
  size: number;
  data: boolean[];
}

export function QrImage({ element, design }: { element: DesignElement; design: Design }) {
  const [matrix, setMatrix] = useState<QrMatrix | null>(null);

  useEffect(() => {
    let disposed = false;
    async function renderQr() {
      const { default: QRCode } = await import('qrcode');
      const result = await firstRenderable(qrCandidates(element, design), async (value) => {
        const code = QRCode.create(value, { errorCorrectionLevel: design.qrStyle.errorCorrection });
        return { size: code.modules.size, data: Array.from(code.modules.data, Boolean) };
      });
      if (!disposed) setMatrix(result);
    }

    renderQr().catch(() => {
      if (!disposed) setMatrix(null);
    });
    return () => {
      disposed = true;
    };
  }, [design, element]);

  if (!matrix) {
    return <rect width={element.width} height={element.height} fill="transparent" stroke={design.theme.text} strokeDasharray="4 4" />;
  }

  const margin = design.qrStyle.margin;
  const total = matrix.size + margin * 2;
  const markSize = Math.max(5, Math.floor(matrix.size * 0.2));
  const markStart = margin + Math.floor((matrix.size - markSize) / 2);
  const initial = design.identity.company.trim().charAt(0) || design.identity.name.trim().charAt(0) || 'C';

  return (
    <svg width={element.width} height={element.height} viewBox={`0 0 ${total} ${total}`} opacity={element.opacity} aria-hidden="true">
      <rect width={total} height={total} fill={design.qrStyle.background} />
      {matrix.data.map((dark, index) => {
        if (!dark) return null;
        const x = margin + (index % matrix.size);
        const y = margin + Math.floor(index / matrix.size);
        if (design.qrStyle.pattern === 'dots') return <circle key={index} fill={design.qrStyle.foreground} cx={x + 0.5} cy={y + 0.5} r={0.43} />;
        return <rect key={index} fill={design.qrStyle.foreground} x={x} y={y} width={1} height={1} rx={design.qrStyle.pattern === 'rounded' ? 0.28 : 0} />;
      })}
      {design.qrStyle.centerMark ? (
        <g>
          <rect x={markStart - 0.5} y={markStart - 0.5} width={markSize + 1} height={markSize + 1} rx={(markSize + 1) / 2} fill={design.qrStyle.background} />
          <circle cx={total / 2} cy={total / 2} r={markSize * 0.42} fill={design.qrStyle.foreground} />
          <text x={total / 2} y={total / 2 + markSize * 0.17} textAnchor="middle" fontSize={markSize * 0.52} fontWeight="700" fill={design.qrStyle.background}>{initial.toUpperCase()}</text>
        </g>
      ) : null}
    </svg>
  );
}
