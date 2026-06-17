import { useRef } from 'react';
import type { CardSide, Design, DesignElement } from '../../types/design';
import { interpolateText, balancedLines } from './render-text';
import { QrImage } from './qr';

interface CardSvgProps {
  design: Design;
  side: CardSide;
  selectedIds?: string[];
  onSelect?: (id: string, additive: boolean) => void;
  onDragElement?: (id: string, dx: number, dy: number) => void;
  onClearSelection?: () => void;
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

function ImageElement({ element, design }: { element: DesignElement; design: Design }) {
  const asset = design.assets.find((item) => item.id === element.assetId);
  if (!asset) {
    return <rect width={element.width} height={element.height} fill="transparent" stroke={design.theme.accent} strokeDasharray="4 4" />;
  }

  return <image href={asset.dataUrl} width={element.width} height={element.height} preserveAspectRatio="xMidYMid slice" />;
}

export function CardSvg({ design, side, selectedIds = [], onSelect, onDragElement, onClearSelection }: CardSvgProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const visible = design.elements
    .filter((element) => element.side === side && !element.hidden)
    .sort((a, b) => a.z - b.z);
  const safeInset = design.card.bleedMm * 3.78 + 9;

  function toSvgPoint(event: React.PointerEvent) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 336,
      y: ((event.clientY - rect.top) / rect.height) * 192
    };
  }

  return (
    <svg
      ref={svgRef}
      role="img"
      aria-label={`${side} side of ${design.meta.name}`}
      viewBox="0 0 336 192"
      className={`card-svg ${design.card.finish}`}
      style={{ background: design.theme.surface, borderRadius: design.card.cornerRadius }}
      onPointerDown={() => onClearSelection?.()}
      onPointerMove={(event) => {
        const drag = dragRef.current;
        if (!drag) return;
        const point = toSvgPoint(event);
        onDragElement?.(drag.id, point.x - drag.x, point.y - drag.y);
        dragRef.current = { ...drag, x: point.x, y: point.y };
      }}
      onPointerUp={() => {
        dragRef.current = null;
      }}
      onPointerCancel={() => {
        dragRef.current = null;
      }}
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
            const point = toSvgPoint(event);
            dragRef.current = element.locked ? null : { id: element.id, x: point.x, y: point.y };
            event.currentTarget.setPointerCapture(event.pointerId);
            onSelect?.(element.id, event.shiftKey);
          }}
          tabIndex={0}
          aria-label={element.label}
        >
          {element.kind === 'shape' ? <ShapeElement element={element} design={design} /> : null}
          {element.kind === 'text' ? <TextElement element={element} design={design} /> : null}
          {element.kind === 'image' ? <ImageElement element={element} design={design} /> : null}
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
