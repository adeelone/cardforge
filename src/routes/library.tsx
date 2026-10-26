import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cloud, CloudOff, CloudUpload, Copy, Download, FilePlus2, Loader2, Search, Trash2, Upload } from 'lucide-react';
import type { Design } from '../types/design';
import { deleteDesign, listDesigns, saveDesign } from '../data/repo/designRepo';
import { createId, slugify } from '../lib/id';
import { downloadText } from '../lib/download';
import { CardSvg } from '../editor/canvas/card-svg';
import { toast } from '../lib/toast';
import { MAX_IMPORT_BYTES, normalizeDesign } from '../lib/design-security';
import { cloudEnabled } from '../lib/cloud/client';
import { useSession } from '../lib/cloud/session';
import { deleteCloudDesign } from '../lib/cloud/api';
import { reconcile, syncDesign, useSyncStore, type SyncState } from '../lib/cloud/sync';
import { cloudErrorMessage } from '../lib/plans';

const SYNC_LABEL: Record<SyncState, string> = {
  synced: 'Synced',
  syncing: 'Syncing…',
  'local-only': 'This device',
  error: 'Sync failed'
};

function SyncBadge({ state }: { state: SyncState }) {
  const Icon = state === 'synced' ? Cloud : state === 'syncing' ? Loader2 : CloudOff;
  return <span className={`sync-badge sync-${state}`}><Icon size={12} aria-hidden="true" />{SYNC_LABEL[state]}</span>;
}

export function LibraryRoute() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [query, setQuery] = useState('');
  const status = useSession((state) => state.status);
  const syncStates = useSyncStore((state) => state.states);
  const signedIn = status === 'signed-in';

  async function refresh() {
    setDesigns(await listDesigns());
  }

  useEffect(() => {
    listDesigns().then(setDesigns).catch(() => setDesigns([]));
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    reconcile()
      .then(setDesigns)
      .catch((error) => {
        console.error(error);
        toast(cloudErrorMessage(error), 'error');
      });
  }, [signedIn]);

  async function upload(design: Design) {
    const state = await syncDesign(design, { explicit: true });
    if (state === 'synced') toast('Card synced to your account');
  }

  async function duplicate(design: Design) {
    try {
      await saveDesign({ ...design, meta: { ...design.meta, id: createId('design'), name: `${design.meta.name} copy`, publishedSlug: undefined } });
      await refresh();
      toast('Design duplicated');
    } catch (error) {
      console.error(error);
      toast('Could not duplicate — check available storage', 'error');
    }
  }

  async function remove(id: string) {
    const inCloud = signedIn && syncStates[id] === 'synced';
    if (!window.confirm(inCloud ? 'Delete this design from this device and your account (including its hosted card)?' : 'Delete this design permanently?')) return;
    try {
      if (inCloud) await deleteCloudDesign(id);
      await deleteDesign(id);
      await refresh();
      toast('Design deleted');
    } catch (error) {
      console.error(error);
      toast('Could not delete this design', 'error');
    }
  }

  async function importDesign(file: File | null) {
    if (!file) return;
    try {
      if (file.size > MAX_IMPORT_BYTES) throw new Error('File is too large');
      const parsed = normalizeDesign(JSON.parse(await file.text()));
      if (!parsed) throw new Error('Not a CardForge file');
      const now = new Date().toISOString();
      await saveDesign({
        ...parsed,
        meta: {
          ...parsed.meta,
          id: createId('design'),
          name: parsed.meta?.name ? `${parsed.meta.name} import` : 'Imported business card',
          slug: slugify(parsed.meta?.name ?? 'imported business card'),
          publishedSlug: undefined,
          createdAt: parsed.meta?.createdAt ?? now,
          updatedAt: now
        }
      });
      await refresh();
      toast('Design imported');
    } catch {
      toast('That file is not a valid CardForge design', 'error');
    }
  }

  const normalizedQuery = query.trim().toLowerCase();
  const visibleDesigns = normalizedQuery
    ? designs.filter((design) => [design.meta.name, design.identity.name, design.identity.company, design.identity.title].some((value) => value.toLowerCase().includes(normalizedQuery)))
    : designs;

  return (
    <main className="page">
      <header className="page-header library-header">
        <div>
          <h1>My Designs</h1>
          <p>
            {signedIn
              ? 'Saved in this browser and synced to your CardForge account.'
              : 'Saved locally in this browser. Export JSON to back up or move between devices.'}
            {cloudEnabled && status === 'signed-out' ? <> <Link to="/login?next=/library" className="text-link">Sign in to sync across devices</Link></> : null}
          </p>
        </div>
        <div className="library-header-actions">
          <label className="ghost-button import-control">
            <Upload size={15} /> Import JSON
            <input type="file" accept="application/json,.json" hidden onChange={(event) => void importDesign(event.target.files?.[0] ?? null)} />
          </label>
          <Link to="/new" className="primary-button"><FilePlus2 size={15} />New card</Link>
        </div>
      </header>

      {designs.length > 0 ? (
        <div className="library-tools">
          <label className="search-field"><Search size={16} aria-hidden="true" /><span className="sr-only">Search saved cards</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by person, company, or role" /></label>
          <span>{visibleDesigns.length} of {designs.length} cards</span>
        </div>
      ) : null}

      {designs.length === 0 ? (
        <div className="empty-state">
          <p>No saved designs yet.</p>
          <p className="muted">Open the editor and CardForge saves your work automatically.</p>
          <Link to="/new" className="primary-button">Create your first card</Link>
        </div>
      ) : (
        <div className="library-grid">
          {visibleDesigns.map((design) => (
            <article className="library-card" key={design.meta.id}>
              <Link to={`/design/${design.meta.id}`} className="library-preview" aria-label={`Open ${design.meta.name}`}>
                <CardSvg design={design} side="front" />
              </Link>
              <div className="library-info">
                <strong>{design.meta.name}</strong>
                <span>{design.identity.title}{design.identity.company ? ` at ${design.identity.company}` : ''}</span>
                <span>Edited {new Date(design.meta.updatedAt).toLocaleString()}</span>
                {signedIn ? <SyncBadge state={syncStates[design.meta.id] ?? 'local-only'} /> : null}
              </div>
              <div className="library-actions">
                <Link to={`/design/${design.meta.id}`} className="ghost-button">Open</Link>
                {signedIn && syncStates[design.meta.id] !== 'synced' ? (
                  <button type="button" className="icon-button" onClick={() => void upload(design)} aria-label="Sync to account" title="Sync to account"><CloudUpload size={15} /></button>
                ) : null}
                <button type="button" className="icon-button" onClick={() => duplicate(design)} aria-label="Duplicate"><Copy size={15} /></button>
                <button type="button" className="icon-button" onClick={() => downloadText(JSON.stringify(design, null, 2), `${design.meta.slug}.cardforge.json`, 'application/json')} aria-label="Export JSON"><Download size={15} /></button>
                <button type="button" className="icon-button danger" onClick={() => void remove(design.meta.id)} aria-label="Delete"><Trash2 size={15} /></button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
