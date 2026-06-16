import { Plus, Trash2, Undo2, Redo2, Shuffle, Download, Save, Type, Palette, QrCode, SlidersHorizontal } from 'lucide-react';
import { FONT_OPTIONS, FONT_PAIRINGS } from '../../data/fonts';
import { CARD_PRESETS } from '../../lib/units';
import { contrastRatio, paletteFromSeed, passesAA } from '../../lib/contrast';
import { templates } from '../templates/templates';
import { useEditorStore } from '../state/store';
import { exportPdf } from '../../exporters/pdf';
import { exportPng } from '../../exporters/png';
import { exportSvgBundle } from '../../exporters/svg';
import { createVCard } from '../../exporters/vcard';
import { encodeSharePayload } from '../../exporters/share-link';
import { downloadBlob, downloadText } from '../../lib/download';
import { saveDesign } from '../../data/repo/designRepo';

export function Inspector() {
  const design = useEditorStore((state) => state.history.present);
  const updateIdentity = useEditorStore((state) => state.updateIdentity);
  const updateTheme = useEditorStore((state) => state.updateTheme);
  const updateCard = useEditorStore((state) => state.updateCard);
  const updateContact = useEditorStore((state) => state.updateContact);
  const addContact = useEditorStore((state) => state.addContact);
  const removeContact = useEditorStore((state) => state.removeContact);
  const switchTemplate = useEditorStore((state) => state.switchTemplate);
  const swapSides = useEditorStore((state) => state.swapSides);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const contrast = contrastRatio(design.theme.text, design.theme.surface);
  const palette = paletteFromSeed(design.theme.brand);

  async function handleExport(kind: 'pdf' | 'png' | 'svg' | 'vcf' | 'json' | 'qr') {
    if (kind === 'pdf') downloadBlob(await exportPdf(design), `${design.meta.slug}.pdf`);
    if (kind === 'png') downloadBlob(await exportPng(design, 300), `${design.meta.slug}.png`);
    if (kind === 'svg') downloadText(exportSvgBundle(design), `${design.meta.slug}.svg`, 'image/svg+xml');
    if (kind === 'vcf') downloadText(createVCard(design), `${design.meta.slug}.vcf`, 'text/vcard');
    if (kind === 'json') downloadText(JSON.stringify(design, null, 2), `${design.meta.slug}.cardforge.json`, 'application/json');
    if (kind === 'qr') {
      const { default: QRCode } = await import('qrcode');
      const data = await QRCode.toString(`${window.location.origin}/c/${design.meta.slug}?d=${encodeSharePayload(design)}`, { type: 'svg' });
      downloadText(data, `${design.meta.slug}-qr.svg`, 'image/svg+xml');
    }
  }

  return (
    <aside className="inspector" aria-label="Card inspector">
      <div className="inspector-actions">
        <button type="button" className="icon-button" onClick={undo} aria-label="Undo"><Undo2 size={17} /></button>
        <button type="button" className="icon-button" onClick={redo} aria-label="Redo"><Redo2 size={17} /></button>
        <button type="button" className="icon-button" onClick={swapSides} aria-label="Swap front and back"><Shuffle size={17} /></button>
        <button type="button" className="primary-button" onClick={() => saveDesign(design)}><Save size={16} />Save</button>
      </div>

      <details open>
        <summary>Identity</summary>
        <label>Name<input value={design.identity.name} onChange={(event) => updateIdentity({ name: event.target.value })} /></label>
        <label>Title<input value={design.identity.title} onChange={(event) => updateIdentity({ title: event.target.value })} /></label>
        <label>Company<input value={design.identity.company} onChange={(event) => updateIdentity({ company: event.target.value })} /></label>
        <label>Department<input value={design.identity.department} onChange={(event) => updateIdentity({ department: event.target.value })} /></label>
        <label>Pronouns<input value={design.identity.pronouns} onChange={(event) => updateIdentity({ pronouns: event.target.value })} /></label>
        <label>Tagline<textarea value={design.identity.tagline} onChange={(event) => updateIdentity({ tagline: event.target.value })} /></label>
      </details>

      <details open>
        <summary>Contact</summary>
        {design.contacts.map((contact) => (
          <div className="row-editor" key={contact.id}>
            <select value={contact.kind} onChange={(event) => updateContact(contact.id, { kind: event.target.value as typeof contact.kind })}>
              <option value="phone">Phone</option>
              <option value="email">Email</option>
              <option value="website">Website</option>
              <option value="address">Address</option>
              <option value="social">Social</option>
            </select>
            <input aria-label="Contact label" value={contact.label} onChange={(event) => updateContact(contact.id, { label: event.target.value })} />
            <input aria-label="Contact value" value={contact.value} onChange={(event) => updateContact(contact.id, { value: event.target.value })} />
            <button type="button" className="icon-button" onClick={() => removeContact(contact.id)} aria-label="Remove contact"><Trash2 size={15} /></button>
          </div>
        ))}
        <button type="button" onClick={addContact}><Plus size={16} /> Add row</button>
      </details>

      <details open>
        <summary><SlidersHorizontal size={16} /> Layout</summary>
        <label>Template<select value={design.meta.templateId} onChange={(event) => switchTemplate(event.target.value)}>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label>
        <label>Size<select value={design.card.preset} onChange={(event) => updateCard({ preset: event.target.value as typeof design.card.preset })}>{Object.entries(CARD_PRESETS).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}</select></label>
        <label>Orientation<select value={design.card.orientation} onChange={(event) => updateCard({ orientation: event.target.value as typeof design.card.orientation })}><option value="landscape">Landscape</option><option value="portrait">Portrait</option></select></label>
        <label>Density<select value={design.card.density} onChange={(event) => updateCard({ density: event.target.value as typeof design.card.density })}><option value="compact">Compact</option><option value="regular">Regular</option><option value="airy">Airy</option></select></label>
        <label>Padding<input type="range" min="12" max="48" value={design.card.padding} onChange={(event) => updateCard({ padding: Number(event.target.value) })} /></label>
        <label><input type="checkbox" checked={design.card.safeAreaVisible} onChange={(event) => updateCard({ safeAreaVisible: event.target.checked })} /> Safe area</label>
      </details>

      <details open>
        <summary><Type size={16} /> Typography</summary>
        <label>Heading<select value={design.theme.headingFont} onChange={(event) => updateTheme({ headingFont: event.target.value, bodyFont: FONT_PAIRINGS[event.target.value] ?? design.theme.bodyFont })}>{FONT_OPTIONS.map((font) => <option key={font}>{font}</option>)}</select></label>
        <label>Body<select value={design.theme.bodyFont} onChange={(event) => updateTheme({ bodyFont: event.target.value })}>{FONT_OPTIONS.map((font) => <option key={font}>{font}</option>)}</select></label>
        <label>Scale<input type="range" min="0.8" max="1.35" step="0.01" value={design.theme.typeScale} onChange={(event) => updateTheme({ typeScale: Number(event.target.value) })} /></label>
        <label>Weight<input type="range" min="400" max="800" step="50" value={design.theme.weight} onChange={(event) => updateTheme({ weight: Number(event.target.value) })} /></label>
      </details>

      <details open>
        <summary><Palette size={16} /> Color</summary>
        <label>Brand<input type="color" value={design.theme.brand} onChange={(event) => updateTheme({ brand: event.target.value })} /></label>
        <label>Surface<input type="color" value={design.theme.surface} onChange={(event) => updateTheme({ surface: event.target.value })} /></label>
        <label>Text<input type="color" value={design.theme.text} onChange={(event) => updateTheme({ text: event.target.value })} /></label>
        <div className="palette-row">{palette.map((color) => <button key={color} type="button" style={{ background: color }} aria-label={`Use ${color}`} onClick={() => updateTheme({ brand: color })} />)}</div>
        <p className={passesAA(design.theme.text, design.theme.surface) ? 'ok' : 'warning'}>Contrast {contrast}:1 AA {passesAA(design.theme.text, design.theme.surface) ? 'passes' : 'fails'}</p>
      </details>

      <details>
        <summary><QrCode size={16} /> Export</summary>
        <div className="export-grid">
          {(['pdf', 'png', 'svg', 'vcf', 'qr', 'json'] as const).map((kind) => (
            <button key={kind} type="button" onClick={() => void handleExport(kind)}><Download size={15} />{kind.toUpperCase()}</button>
          ))}
        </div>
      </details>
    </aside>
  );
}
