import { useEffect, useState } from 'react';
import type { DesignElement, Design } from '../../types/design';
import { qrCandidates, firstRenderable, QR_OPTIONS } from '../../exporters/qr-value';

export function QrImage({ element, design }: { element: DesignElement; design: Design }) {
  const [href, setHref] = useState('');

  useEffect(() => {
    let disposed = false;
    async function renderQr() {
      const { default: QRCode } = await import('qrcode');
      const candidates = qrCandidates(element, design);
      const dataUrl = await firstRenderable(candidates, (value) =>
        QRCode.toDataURL(value, { ...QR_OPTIONS, color: { dark: design.theme.text, light: '#00000000' } })
      );
      if (!disposed) setHref(dataUrl ?? '');
    }

    renderQr().catch(() => {
      if (!disposed) setHref('');
    });
    return () => {
      disposed = true;
    };
  }, [design, element]);

  if (!href) {
    return <rect width={element.width} height={element.height} fill="transparent" stroke={design.theme.text} strokeDasharray="4 4" />;
  }
  return <image href={href} width={element.width} height={element.height} preserveAspectRatio="xMidYMid meet" opacity={element.opacity} />;
}
