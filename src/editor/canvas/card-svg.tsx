import type { CardSide, Design, DesignElement } from '../../types/design';
import { interpolateText, balancedLines } from './render-text';
import { QrImage } from './qr';

interface CardSvgProps {
  design: Design;
  side: CardSide;
  selectedIds?: string[];
  onSelect?: (id: string, additive: boolean) => void;
}

function TextElement({ element, design }: { element: DesignElement; design: Design }) {
  const value = interpolateText(element.text ?? '', design);
  const lines = element.id === 'name' ? balancedLines(value, 20) : value.split('\n');
  const fontSize = (element.fontSize ?? 12) * design.theme.typeScale;
  return (
    <text
      fill={element.fill ?? design.theme.text}
      fontFamily={element.fontFamily ?? (element.id === 'name' ? design.theme.headingFont : design.theme.bodyFont)}
      fontSize={fontSize}
      fontWeight={element.id === 'name' ? design.theme.weight : 500}
      letterSpacing={design.theme.letterSpacing}
    >
      {lines.map((line, index) => (
        <tspan key={`${line}-${index}`} x={0} dy={index === 0 ? fontSize : fontSize * design.theme.lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function ShapeElement({ element, design }: { element: DesignElement; design: Design }) {
  const isDot = element.width === element.height && element.width <= 20;
  return (
    <rect
      width={element.width}
      height={element.height}
      rx={isDot ? element.width / 2 : Math.min(8, design.card.cornerRadius)}
      fill={element.fill ?? design.theme.brand}
      stroke={element.stroke}
    />
  );
}

export function CardSvg({ design, side, selectedIds = [], onSelect }: CardSvgProps) {
  const visible = design.elements
    .filter((element) => element.side === side && !element.hidden)
    .sort((a, b) => a.z - b.z);
  const safeInset = design.card.bleedMm * 3.78 + 9;

  return (
    <svg
      role="img"
      aria-label={`${side} side of ${design.meta.name}`}
      viewBox="0 0 336 192"
      className={`card-svg ${design.card.finish}`}
      style={{ background: design.theme.surface, borderRadius: design.card.cornerRadius }}
    >
      <rect width="336" height="192" fill={design.theme.surface} rx={design.card.cornerRadius} />
      {design.card.safeAreaVisible ? (
        <rect
          x={safeInset}
          y={safeInset}
          width={336 - safeInset * 2}
          height={192 - safeInset * 2}
          fill="none"
          stroke={design.theme.accent}
          strokeDasharray="5 4"
          opacity="0.32"
        />
      ) : null}
      {visible.map((element) => (
        <g
          key={element.id}
          transform={`translate(${element.x} ${element.y}) rotate(${element.rotation})`}
          className="canvas-element"
          onPointerDown={(event) => {
            event.stopPropagation();
            onSelect?.(element.id, event.shiftKey);
          }}
          tabIndex={0}
          aria-label={element.label}
        >
          {element.kind === 'shape' ? <ShapeElement element={element} design={design} /> : null}
          {element.kind === 'text' ? <TextElement element={element} design={design} /> : null}
          {element.kind === 'qr' ? <QrImage element={element} design={design} /> : null}
          {selectedIds.includes(element.id) ? (
            <rect
              width={element.width}
              height={element.height}
              fill="none"
              stroke="#0e8f7e"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              pointerEvents="none"
            />
          ) : null}
        </g>
      ))}
    </svg>
  );
}
