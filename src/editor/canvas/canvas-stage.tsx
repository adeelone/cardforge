import { useEffect, useState } from 'react';
import { Hand, Maximize2, Minus, Plus, RotateCcw } from 'lucide-react';
import { CardSvg } from './card-svg';
import { useEditorStore } from '../state/store';
import { formatDimensions } from '../../lib/units';
import type { CardSide } from '../../types/design';

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

export function CanvasStage({ units = 'mm' }: { units?: 'mm' | 'in' }) {
  const design = useEditorStore((state) => state.history.present);
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const activeSide = useEditorStore((state) => state.activeSide);
  const selectElement = useEditorStore((state) => state.selectElement);
  const clearSelection = useEditorStore((state) => state.clearSelection);
  const setActiveSide = useEditorStore((state) => state.setActiveSide);
  const moveSelected = useEditorStore((state) => state.moveSelected);
  const deleteSelected = useEditorStore((state) => state.deleteSelected);
  const duplicateSelected = useEditorStore((state) => state.duplicateSelected);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const [mockup, setMockup] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
        return;
      }
      if (mod && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        duplicateSelected();
        return;
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedIds.length) {
          event.preventDefault();
          deleteSelected();
        }
        return;
      }
      if (event.key === 'Escape') {
        clearSelection();
        return;
      }
      const delta = event.shiftKey ? 8 : 1;
      if (event.key === 'ArrowUp') moveSelected(0, -delta);
      if (event.key === 'ArrowDown') moveSelected(0, delta);
      if (event.key === 'ArrowLeft') moveSelected(-delta, 0);
      if (event.key === 'ArrowRight') moveSelected(delta, 0);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [moveSelected, deleteSelected, duplicateSelected, undo, redo, clearSelection, selectedIds.length]);

  function face(side: CardSide, caption: string) {
    return (
      <figure className={activeSide === side ? 'card-face active' : 'card-face'} onPointerDownCapture={() => setActiveSide(side)}>
        <CardSvg
          design={design}
          side={side}
          interactive
          selectedIds={selectedIds}
          onSelect={selectElement}
          onBackgroundDown={() => {
            setActiveSide(side);
            clearSelection();
          }}
        />
        <figcaption>{caption}</figcaption>
      </figure>
    );
  }

  return (
    <section className="canvas-stage" aria-label="Card preview">
      <div className="stage-toolbar">
        <span className="dims">{formatDimensions(design.card.widthMm, design.card.heightMm, units)}</span>
        <div className="stage-tools">
          <button className="icon-button" type="button" onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))} aria-label="Zoom out">
            <Minus size={16} />
          </button>
          <span className="zoom-value">{Math.round(zoom * 100)}%</span>
          <button className="icon-button" type="button" onClick={() => setZoom((z) => Math.min(2, Math.round((z + 0.1) * 10) / 10))} aria-label="Zoom in">
            <Plus size={16} />
          </button>
          <button className="icon-button" type="button" onClick={() => setZoom(1)} aria-label="Reset zoom">
            <RotateCcw size={15} />
          </button>
          <button className={`icon-button ${mockup ? 'is-on' : ''}`} type="button" onClick={() => setMockup((value) => !value)} aria-label="Toggle 3D mockup" aria-pressed={mockup}>
            {mockup ? <Maximize2 size={16} /> : <Hand size={16} />}
          </button>
        </div>
      </div>
      <div className="stage-scroll">
        <div className={`preview-pair ${mockup ? 'mockup' : ''}`} style={{ '--zoom': zoom } as React.CSSProperties}>
          {face('front', 'Front')}
          {face('back', 'Back')}
        </div>
      </div>
    </section>
  );
}
