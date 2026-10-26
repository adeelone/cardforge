import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { FileQuestion, FolderOpen, LayoutTemplate, QrCode, Shapes, Type } from 'lucide-react';
import { CanvasStage } from '../editor/canvas/canvas-stage';
import { Inspector } from '../editor/inspector/inspector';
import { useEditorStore } from '../editor/state/store';
import { createStarterDesign } from '../editor/templates/templates';
import { getDesign, saveDesign } from '../data/repo/designRepo';
import { decodeSharePayload, extractSharePayload } from '../exporters/share-link';
import { useUnits } from '../app/theme';
import { toast } from '../lib/toast';
import { createId } from '../lib/id';
import { cloudEnabled } from '../lib/cloud/client';
import { ensureSession, useSession } from '../lib/cloud/session';
import { loadFromCloud, syncDesign } from '../lib/cloud/sync';
import type { Design } from '../types/design';

type LoadState = 'ready' | 'loading' | 'missing';

/** A design received from someone else becomes the recipient's own copy. */
function adoptSharedDesign(design: Design): Design {
  const now = new Date().toISOString();
  return { ...design, meta: { ...design.meta, id: createId('design'), publishedSlug: undefined, createdAt: now, updatedAt: now } };
}

export function EditorRoute({ mode }: { mode: 'new' | 'existing' }) {
  const { id } = useParams();
  const [params] = useSearchParams();
  const location = useLocation();
  const design = useEditorStore((state) => state.history.present);
  const dirty = useEditorStore((state) => state.dirty);
  const setDesign = useEditorStore((state) => state.setDesign);
  const addElement = useEditorStore((state) => state.addElement);
  const signedIn = useSession((state) => state.status === 'signed-in');
  const units = useUnits();
  // Only warn once per failure streak — autosave fires on every keystroke, and
  // if storage is unavailable (private browsing, quota exceeded, a locked-down
  // managed browser) that would otherwise spam a toast every 700ms.
  const autosaveWarned = useRef(false);
  const template = params.get('template');
  // Share links live in the URL fragment (#d=...); older links may still use
  // the query string (?d=...) — extractSharePayload reads either.
  const sharedPayload = extractSharePayload(location.search, location.hash);
  const shared = useMemo(() => (sharedPayload ? decodeSharePayload(sharedPayload) : null), [sharedPayload]);
  const routeKey = `${mode}|${id ?? ''}|${template ?? ''}|${sharedPayload}`;
  const [stored, setStored] = useState<{ key: string; found: boolean } | null>(null);

  // New cards and share links resolve synchronously; stored designs load async.
  const loadState: LoadState = sharedPayload
    ? shared ? 'ready' : 'missing'
    : mode === 'new'
      ? 'ready'
      : stored?.key === routeKey
        ? stored.found ? 'ready' : 'missing'
        : 'loading';

  useEffect(() => {
    if (sharedPayload) {
      if (shared) setDesign(adoptSharedDesign(shared));
      return;
    }
    if (mode === 'new') {
      setDesign(createStarterDesign(template ?? undefined));
      return;
    }
    if (!id) return;
    let cancelled = false;
    (async () => {
      let design = await getDesign(id).catch((error) => {
        console.error(error);
        toast('Could not load this design — local storage may be unavailable', 'error');
        return null;
      });
      if (!design && cloudEnabled) {
        await ensureSession();
        design = await loadFromCloud(id).catch(() => null);
      }
      if (cancelled) return;
      if (design) setDesign(design);
      setStored({ key: routeKey, found: Boolean(design) });
    })();
    return () => {
      cancelled = true;
    };
  }, [id, mode, template, sharedPayload, shared, routeKey, setDesign]);

  // Local autosave: only after a real edit, so merely opening /new or a share
  // link never adds an untouched card to the library.
  useEffect(() => {
    if (!dirty || loadState !== 'ready') return;
    const handle = window.setTimeout(() => {
      saveDesign(design, { touch: false })
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
  }, [design, dirty, loadState]);

  // Cloud sync runs on a slower debounce than local storage.
  useEffect(() => {
    if (!dirty || !signedIn || loadState !== 'ready') return;
    const handle = window.setTimeout(() => void syncDesign(design), 2500);
    return () => window.clearTimeout(handle);
  }, [design, dirty, signedIn, loadState]);

  if (loadState !== 'ready') {
    return (
      <main className="page not-found-page">
        {loadState === 'loading' ? (
          <p className="muted" role="status">Opening your card…</p>
        ) : (
          <>
            <FileQuestion size={30} aria-hidden="true" />
            <h1>We couldn’t find that card.</h1>
            <p>It isn’t saved in this browser{cloudEnabled ? ' or in your CardForge Cloud account' : ''}. It may have been deleted, or it was created on another device.</p>
            <div className="not-found-actions">
              <Link to="/library" className="primary-button"><FolderOpen size={17} />Open My cards</Link>
              <Link to="/new" className="ghost-button">Start a new card</Link>
            </div>
          </>
        )}
      </main>
    );
  }

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
