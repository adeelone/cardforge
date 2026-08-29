import { useEffect, useRef } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { FolderOpen, LayoutTemplate, QrCode, Shapes, Type } from 'lucide-react';
import { CanvasStage } from '../editor/canvas/canvas-stage';
import { Inspector } from '../editor/inspector/inspector';
import { useEditorStore } from '../editor/state/store';
import { createStarterDesign } from '../editor/templates/templates';
import { getDesign, saveDesign } from '../data/repo/designRepo';
import { decodeSharePayload, extractSharePayload } from '../exporters/share-link';
import { useUnits } from '../app/theme';
import { toast } from '../lib/toast';

export function EditorRoute({ mode }: { mode: 'new' | 'existing' }) {
  const { id } = useParams();
  const [params] = useSearchParams();
  const location = useLocation();
  const design = useEditorStore((state) => state.history.present);
  const setDesign = useEditorStore((state) => state.setDesign);
  const addElement = useEditorStore((state) => state.addElement);
  const units = useUnits();
  // Only warn once per failure streak — autosave fires on every keystroke, and
  // if storage is unavailable (private browsing, quota exceeded, a locked-down
  // managed browser) that would otherwise spam a toast every 700ms.
  const autosaveWarned = useRef(false);

  useEffect(() => {
    // Share links live in the URL fragment (#d=...); older links may still
    // use the query string (?d=...) — extractSharePayload reads either.
    const shared = extractSharePayload(location.search, location.hash);
    const template = params.get('template');
    if (shared) {
      const decoded = decodeSharePayload(shared);
      if (decoded) setDesign(decoded);
      return;
    }
    if (mode === 'existing' && id) {
      getDesign(id)
        .then((stored) => stored && setDesign(stored))
        .catch((error) => {
          console.error(error);
          toast('Could not load this design — local storage may be unavailable', 'error');
        });
    }
    if (mode === 'new') setDesign(createStarterDesign(template ?? undefined));
  }, [id, mode, params, location.search, location.hash, setDesign]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      saveDesign(design)
        .then(() => {
          autosaveWarned.current = false;
        })
        .catch((error) => {
          console.error(error);
          if (!autosaveWarned.current) {
            autosaveWarned.current = true;
            toast('Autosave failed — check available storage. Export JSON to avoid losing work.', 'error');
          }
        });
    }, 700);
    return () => window.clearTimeout(handle);
  }, [design]);

  return (
    <main className="editor-route">
      <h1 className="sr-only">Business card editor</h1>
      <aside className="editor-rail" aria-label="Editor tools">
        <button type="button" onClick={() => addElement('text')} title="Add text"><Type size={19} /><span>Text</span></button>
        <button type="button" onClick={() => addElement('shape')} title="Add shape"><Shapes size={19} /><span>Shape</span></button>
        <button type="button" onClick={() => addElement('qr')} title="Add QR code"><QrCode size={19} /><span>QR</span></button>
        <Link to="/templates" title="Browse templates"><LayoutTemplate size={19} /><span>Templates</span></Link>
        <Link to="/library" title="Open my cards"><FolderOpen size={19} /><span>My cards</span></Link>
      </aside>
      <CanvasStage units={units} />
      <Inspector />
    </main>
  );
}
