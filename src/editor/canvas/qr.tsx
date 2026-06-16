import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { DesignElement, Design } from '../../types/design';
import { createVCard } from '../../exporters/vcard';
import { encodeSharePayload } from '../../exporters/share-link';

export function QrImage({ element, design }: { element: DesignElement; design: Design }) {
  const [href, setHref] = useState('');

  useEffect(() => {
    const value =
      element.qrMode === 'vcard'
        ? createVCard(design)
        : element.qrMode === 'url'
          ? window.location.href
          : `${window.location.origin}/c/${design.meta.slug}?d=${encodeSharePayload(design)}`;
    QRCode.toDataURL(value, { margin: 1, color: { dark: design.theme.text, light: '#00000000' } }).then(setHref).catch(() => setHref(''));
  }, [design, element.qrMode]);

  if (!href) return <rect width={element.width} height={element.height} fill="transparent" stroke={design.theme.text} strokeDasharray="4 4" />;
  return <image href={href} width={element.width} height={element.height} preserveAspectRatio="xMidYMid meet" />;
}
