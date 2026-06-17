import { useEffect, useState } from 'react';
import { Hand, PanelTopClose } from 'lucide-react';
import { CardSvg } from './card-svg';
import { useEditorStore } from '../state/store';

export function CanvasStage() {
  const design = useEditorStore((state) => state.history.present);
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const selectElement = useEditorStore((state) => state.selectElement);
  const clearSelection = useEditorStore((state) => state.clearSelection);
  const moveSelected = useEditorStore((state) => state.moveSelected);
  const updateElement = useEditorStore((state) => state.updateElement);
  const [mockup, setMockup] = useState(false);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
      const delta = event.shiftKey ? 8 : 1;
      if (event.key === 'ArrowUp') moveSelected(0, -delta);
      if (event.key === 'ArrowDown') moveSelected(0, delta);
      if (event.key === 'ArrowLeft') moveSelected(-delta, 0);
      if (event.key === 'ArrowRight') moveSelected(delta, 0);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [moveSelected]);

  return (
    <section className="canvas-stage" aria-label="Card preview">
      <div className="stage-toolbar">
        <span>{design.card.widthMm} x {design.card.heightMm} mm</span>
        <button className="icon-button" type="button" onClick={() => setMockup((value) => !value)} aria-label="Toggle hand mockup">
          {mockup ? <PanelTopClose size={17} /> : <Hand size={17} />}
        </button>
      </div>
      <div className={`preview-pair ${mockup ? 'mockup' : ''}`}>
        <figure>
          <CardSvg
            design={design}
            side="front"
            selectedIds={selectedIds}
            onSelect={selectElement}
            onClearSelection={clearSelection}
            onDragElement={(id, dx, dy) => updateElement(id, { x: Math.round(design.elements.find((element) => element.id === id)!.x + dx), y: Math.round(design.elements.find((element) => element.id === id)!.y + dy) })}
          />
          <figcaption>Front</figcaption>
        </figure>
        <figure>
          <CardSvg
            design={design}
            side="back"
            selectedIds={selectedIds}
            onSelect={selectElement}
            onClearSelection={clearSelection}
            onDragElement={(id, dx, dy) => updateElement(id, { x: Math.round(design.elements.find((element) => element.id === id)!.x + dx), y: Math.round(design.elements.find((element) => element.id === id)!.y + dy) })}
          />
          <figcaption>Back</figcaption>
        </figure>
      </div>
    </section>
  );
}
