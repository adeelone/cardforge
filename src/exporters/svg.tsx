import { renderToStaticMarkup } from 'react-dom/server';
import type { CardSide, Design } from '../types/design';
import { CardSvg } from '../editor/canvas/card-svg';

export function exportSideSvg(design: Design, side: CardSide) {
  return `<?xml version="1.0" encoding="UTF-8"?>${renderToStaticMarkup(<CardSvg design={design} side={side} />)}`;
}

export function exportSvgBundle(design: Design) {
  const front = renderToStaticMarkup(<CardSvg design={design} side="front" />);
  const back = renderToStaticMarkup(<CardSvg design={design} side="back" />);
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 220"><g transform="translate(0 0)">${front}</g><g transform="translate(364 0)">${back}</g></svg>`;
}
