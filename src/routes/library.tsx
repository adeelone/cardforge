import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Download, Trash2 } from 'lucide-react';
import type { Design } from '../types/design';
import { deleteDesign, listDesigns, saveDesign } from '../data/repo/designRepo';
import { createId } from '../lib/id';
import { downloadText } from '../lib/download';

export function LibraryRoute() {
  const [designs, setDesigns] = useState<Design[]>([]);

  async function refresh() {
    setDesigns(await listDesigns());
  }

  useEffect(() => {
    listDesigns().then(setDesigns).catch(() => setDesigns([]));
  }, []);

  async function duplicate(design: Design) {
    await saveDesign({ ...design, meta: { ...design.meta, id: createId('design'), name: `${design.meta.name} copy` } });
    await refresh();
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>My Designs</h1>
        <p>Stored locally in IndexedDB. Export JSON before clearing browser data.</p>
      </header>
      <div className="library-list">
        {designs.length === 0 ? <p className="empty">No saved designs yet. Open the editor and CardForge will save automatically.</p> : null}
        {designs.map((design) => (
          <article className="library-row" key={design.meta.id}>
            <div>
              <strong>{design.meta.name}</strong>
              <span>{new Date(design.meta.updatedAt).toLocaleString()}</span>
            </div>
            <Link to={`/design/${design.meta.id}`}>Open</Link>
            <button type="button" onClick={() => duplicate(design)}><Copy size={15} />Duplicate</button>
            <button type="button" onClick={() => downloadText(JSON.stringify(design, null, 2), `${design.meta.slug}.cardforge.json`, 'application/json')}><Download size={15} />JSON</button>
            <button type="button" onClick={async () => { await deleteDesign(design.meta.id); await refresh(); }}><Trash2 size={15} />Delete</button>
          </article>
        ))}
      </div>
    </main>
  );
}
