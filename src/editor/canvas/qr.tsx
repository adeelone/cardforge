import { useEffect, useState } from 'react';
import type { DesignElement, Design } from '../../types/design';
import { createVCard } from '../../exporters/vcard';
import { encodeSharePayload } from '../../exporters/share-link';

export function QrImage({ element, design }: { element: DesignElement; design: Design }) {
  const [href, setHref] = useState('');

  useEffect(() => {
    let disposed = false;
    async function renderQr() {
      const { default: QRCode } = await import('qrcode');
      const value =
        element.qrMode === 'vcard'
          ? createVCard(design)
          : element.qrMode === 'url'
            ? window.location.href
            : `${window.location.origin}/c/${design.meta.slug}?d=${encodeSharePayload(design)}`;
      const dataUrl = await QRCode.toDataURL(value, { margin: 1, color: { dark: design.theme.text, light: '#00000000' } });
      if (!disposed) setHref(dataUrl);
    }

    renderQr().catch(() => {
      if (!disposed) setHref('');
    });
    return () => {
      disposed = true;
    };
  }, [design, element.qrMode]);

  if (!href) return <rect width={element.width} height={element.height} fill="transparent" stroke={design.theme.text} strokeDasharray="4 4" />;
  return <image href={href} width={element.width} height={element.height} preserveAspectRatio="xMidYMid meet" />;
}
