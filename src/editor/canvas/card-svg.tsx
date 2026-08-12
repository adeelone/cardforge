import { useRef } from 'react';
import type { CardSide, Design, DesignElement } from '../../types/design';
import { layoutText, alignToAnchor, anchorX } from './render-text';
import { fontStack } from '../../data/fonts';
import { canvasDims } from '../../lib/units';
import { useEditorStore } from '../state/store';
import { QrImage } from './qr';

interface CardSvgProps {
  design: Design;
  side: CardSide;
  interactive?: boolean;
  selectedIds?: string[];
  onSelect?: (id: string, additive: boolean) => void;
  onBackgroundDown?: () => void;
}

const SELECT = '#0e8f7e';

function TextElement({ element, design }: { element: DesignElement; design: Design }) {
  const { lines, fontSize, fontFamily, fontWeight, align, letterSpacing } = layoutText(element, design);
  const x = anchorX(align, element.width);
  return (
    <text
      fill={element.fill ?? design.theme.text}
      fontFamily={fontStack(fontFamily)}
      fontSize={fontSize}
      fontWeight={fontWeight}
      letterSpacing={letterSpacing}
      textAnchor={alignToAnchor(align)}
      opacity={element.opacity}
    >
      {lines.map((line, index) => (
        <tspan key={`${line}-${index}`} x={x} dy={index === 0 ? fontSize : fontSize * design.theme.lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function ShapeElement({ element, design }: { element: DesignElement; design: Design }) {
  const gradientId = element.gradient ? `grad-${element.id}` : undefined;
  const fill = gradientId ? `url(#${gradientId})` : element.fill ?? design.theme.brand;
  const shape = element.shape ?? 'rect';
  return (
    <>
      {element.gradient ? (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={element.gradient[0]} />
            <stop offset="100%" stopColor={element.gradient[1]} />
          </linearGradient>
        </defs>
      ) : null}
      {shape === 'ellipse' ? (
        <ellipse
          cx={element.width / 2}
          cy={element.height / 2}
          rx={element.width / 2}
          ry={element.height / 2}
          fill={fill}
          stroke={element.stroke}
          strokeWidth={element.strokeWidth}
          opacity={element.opacity}
        />
      ) : shape === 'line' ? (
        <line
          x1={0}
          y1={element.height / 2}
          x2={element.width}
          y2={element.height / 2}
          stroke={element.stroke ?? fill}
          strokeWidth={element.strokeWidth ?? Math.max(1, element.height)}
          strokeLinecap="round"
          opacity={element.opacity}
        />
      ) : (
        <rect
          width={element.width}
          height={element.height}
          rx={element.radius ?? Math.min(8, design.card.cornerRadius)}
          fill={fill}
          stroke={element.stroke}
          strokeWidth={element.strokeWidth}
          opacity={element.opacity}
        />
      )}
    </>
  );
}

function ImageElement({ element, design }: { element: DesignElement; design: Design }) {
  const asset = design.assets.find((item) => item.id === element.assetId);
  if (!asset) {
    return (
      <g opacity={element.opacity}>
        <rect
          width={element.width}
          height={element.height}
          rx={element.radius ?? 6}
          fill="rgba(127,127,127,0.12)"
          stroke={design.theme.accent}
          strokeDasharray="4 4"
        />
      </g>
    );
  }
  const clipId = `clip-${element.id}`;
  return (
    <g opacity={element.opacity}>
      <defs>
        <clipPath id={clipId}>
          <rect width={element.width} height={element.height} rx={element.radius ?? 0} />
        </clipPath>
      </defs>
      <image
        href={asset.dataUrl}
        width={element.width}
        height={element.height}
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#${clipId})`}
      />
    </g>
  );
}

export function CardSvg({ design, side, interactive = false, selectedIds = [], onSelect, onBackgroundDown }: CardSvgProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const drag = useRef<
    | { mode: 'move'; ids: string[]; last: { x: number; y: number } }
    | { mode: 'resize'; id: string; handle: string; start: { x: number; y: number }; box: DesignElement }
    | { mode: 'rotate'; id: string; center: { x: number; y: number } }
    | null
  >(null);

  const { w, h } = canvasDims(design.card);
  const visible = design.elements.filter((element) => element.side === side && !element.hidden).sort((a, b) => a.z - b.z);
  const safeInset = design.card.bleedMm * 3.78 + 9;
  const selected = interactive && selectedIds.length === 1 ? visible.find((element) => element.id === selectedIds[0]) : undefined;

  function toPoint(event: React.PointerEvent) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * w, y: ((event.clientY - rect.top) / rect.height) * h };
  }

  function onPointerMove(event: React.PointerEvent) {
    const current = drag.current;
    if (!current) return;
    const point = toPoint(event);
    const s = useEditorStore.getState();
    if (current.mode === 'move') {
      const dx = point.x - current.last.x;
      const dy = point.y - current.last.y;
      const updates = current.ids.map((id) => {
        const el = design.elements.find((element) => element.id === id)!;
        return { id, patch: { x: Math.round(el.x + dx), y: Math.round(el.y + dy) } };
      });
      s.liveTransform(updates);
      current.last = point;
    } else if (current.mode === 'resize') {
      const { box, handle } = current;
      const rad = (box.rotation * Math.PI) / 180;
      const cos = Math.cos(-rad);
      const sin = Math.sin(-rad);
      const rawX = point.x - current.start.x;
      const rawY = point.y - current.start.y;
      const dx = rawX * cos - rawY * sin;
      const dy = rawX * sin + rawY * cos;
      let x = box.x;
      let y = box.y;
      let width = box.width;
      let height = box.height;
      if (handle.includes('e')) width = box.width + dx;
      if (handle.includes('s')) height = box.height + dy;
      if (handle.includes('w')) {
        width = box.width - dx;
        x = box.x + dx;
      }
      if (handle.includes('n')) {
        height = box.height - dy;
        y = box.y + dy;
      }
      s.liveTransform([
        {
          id: current.id,
          patch: { x: Math.round(x), y: Math.round(y), width: Math.max(8, Math.round(width)), height: Math.max(6, Math.round(height)) }
        }
      ]);
    } else {
      const angle = (Math.atan2(point.y - current.center.y, point.x - current.center.x) * 180) / Math.PI + 90;
      s.liveTransform([{ id: current.id, patch: { rotation: Math.round(angle) } }]);
    }
  }

  function endDrag() {
    if (drag.current) {
      useEditorStore.getState().endTransform();
      drag.current = null;
    }
  }

  function startResize(event: React.PointerEvent, element: DesignElement, handle: string) {
    event.stopPropagation();
    useEditorStore.getState().beginTransform();
    drag.current = { mode: 'resize', id: element.id, handle, start: toPoint(event), box: { ...element } };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function startRotate(event: React.PointerEvent, element: DesignElement) {
    event.stopPropagation();
    useEditorStore.getState().beginTransform();
    drag.current = {
      mode: 'rotate',
      id: element.id,
      center: { x: element.x + element.width / 2, y: element.y + element.height / 2 }
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
  const handlePos = (element: DesignElement, key: string) => ({
    x: key.includes('w') ? 0 : key.includes('e') ? element.width : element.width / 2,
    y: key.includes('n') ? 0 : key.includes('s') ? element.height : element.height / 2
  });

  return (
    <svg
      ref={svgRef}
      role="img"
      aria-label={`${side} side of ${design.meta.name}`}
      viewBox={`0 0 ${w} ${h}`}
      className={`card-svg ${design.card.finish} ${design.theme.dark ? 'is-dark' : ''}`}
      style={{ background: design.theme.surface, borderRadius: design.card.cornerRadius, aspectRatio: `${w} / ${h}` }}
      onPointerDown={interactive ? () => onBackgroundDown?.() : undefined}
      onPointerMove={interactive ? onPointerMove : undefined}
      onPointerUp={interactive ? endDrag : undefined}
      onPointerCancel={interactive ? endDrag : undefined}
    >
      <rect width={w} height={h} fill={design.theme.surface} rx={design.card.cornerRadius} />
      {design.card.safeAreaVisible ? (
        <rect
          x={safeInset}
          y={safeInset}
          width={w - safeInset * 2}
          height={h - safeInset * 2}
          fill="none"
          stroke={design.theme.accent}
          strokeDasharray="5 4"
          opacity="0.32"
          pointerEvents="none"
        />
      ) : null}
      {visible.map((element) => (
        <g
          key={element.id}
          transform={`translate(${element.x} ${element.y}) rotate(${element.rotation} ${element.width / 2} ${element.height / 2})`}
          className={interactive ? 'canvas-element' : undefined}
          onPointerDown={
            interactive
              ? (event) => {
                  event.stopPropagation();
                  onSelect?.(element.id, event.shiftKey);
                  if (element.locked) return;
                  const s = useEditorStore.getState();
                  s.beginTransform();
                  const point = toPoint(event);
                  const ids = event.shiftKey ? Array.from(new Set([...selectedIds, element.id])) : [element.id];
                  drag.current = { mode: 'move', ids, last: point };
                  event.currentTarget.setPointerCapture(event.pointerId);
                }
              : undefined
          }
          tabIndex={interactive ? 0 : undefined}
          aria-label={element.label}
        >
          {element.kind === 'shape' ? <ShapeElement element={element} design={design} /> : null}
          {element.kind === 'text' ? <TextElement element={element} design={design} /> : null}
          {element.kind === 'image' ? <ImageElement element={element} design={design} /> : null}
          {element.kind === 'qr' ? <QrImage element={element} design={design} /> : null}
        </g>
      ))}
      {selected && !selected.locked ? (
        <g
          transform={`translate(${selected.x} ${selected.y}) rotate(${selected.rotation} ${selected.width / 2} ${selected.height / 2})`}
          pointerEvents="all"
        >
          <rect width={selected.width} height={selected.height} fill="none" stroke={SELECT} strokeWidth="1.5" strokeDasharray="4 3" />
          <line x1={selected.width / 2} y1={0} x2={selected.width / 2} y2={-18} stroke={SELECT} strokeWidth="1.2" />
          <circle
            cx={selected.width / 2}
            cy={-18}
            r={5}
            fill="#fff"
            stroke={SELECT}
            strokeWidth="1.5"
            className="handle rotate-handle"
            onPointerDown={(event) => startRotate(event, selected)}
          />
          {handles.map((key) => {
            const pos = handlePos(selected, key);
            return (
              <rect
                key={key}
                x={pos.x - 4}
                y={pos.y - 4}
                width={8}
                height={8}
                rx={2}
                fill="#fff"
                stroke={SELECT}
                strokeWidth="1.5"
                className={`handle handle-${key}`}
                onPointerDown={(event) => startResize(event, selected, key)}
              />
            );
          })}
        </g>
      ) : null}
    </svg>
  );
}
