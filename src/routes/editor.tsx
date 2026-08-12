import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CanvasStage } from '../editor/canvas/canvas-stage';
import { Inspector } from '../editor/inspector/inspector';
import { useEditorStore } from '../editor/state/store';
import { createStarterDesign } from '../editor/templates/templates';
import { getDesign, saveDesign } from '../data/repo/designRepo';
import { decodeSharePayload } from '../exporters/share-link';
import { useUnits } from '../app/theme';

export function EditorRoute({ mode }: { mode: 'new' | 'existing' }) {
  const { id } = useParams();
  const [params] = useSearchParams();
  const design = useEditorStore((state) => state.history.present);
  const setDesign = useEditorStore((state) => state.setDesign);
  const units = useUnits();

  useEffect(() => {
    const shared = params.get('d');
    const template = params.get('template');
    if (shared) {
      const decoded = decodeSharePayload(shared);
      if (decoded) setDesign(decoded);
      return;
    }
    if (mode === 'existing' && id) {
      getDesign(id).then((stored) => stored && setDesign(stored));
    }
    if (mode === 'new') setDesign(createStarterDesign(template ?? undefined));
  }, [id, mode, params, setDesign]);

  useEffect(() => {
    const handle = window.setTimeout(() => void saveDesign(design), 700);
    return () => window.clearTimeout(handle);
  }, [design]);

  return (
    <main className="editor-route">
      <CanvasStage units={units} />
      <Inspector />
    </main>
  );
}
