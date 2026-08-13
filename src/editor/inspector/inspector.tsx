import { useRef } from 'react';
import {
  ArrowDownToLine,
  ArrowUpToLine,
  Copy,
  Download,
  FileSpreadsheet,
  Eye,
  EyeOff,
  ImagePlus,
  Layers,
  Link as LinkIcon,
  Lock,
  Plus,
  QrCode,
  Redo2,
  Save,
  Shapes,
  Shuffle,
  SlidersHorizontal,
  Square,
  Trash2,
  Type,
  Undo2,
  Unlock,
  Palette,
  ShieldCheck,
  Users
} from 'lucide-react';
import { FONTS, FONT_PAIRINGS } from '../../data/fonts';
import { CARD_PRESETS } from '../../lib/units';
import { contrastRatio, paletteFromSeed, passesAA } from '../../lib/contrast';
import { templates } from '../templates/templates';
import { useEditorStore } from '../state/store';
import { createVCard } from '../../exporters/vcard';
import { buildShareUrl } from '../../exporters/share-link';
import { downloadBlob, downloadText } from '../../lib/download';
import { saveDesign } from '../../data/repo/designRepo';
import { toast } from '../../lib/toast';
import type { Alignment, DesignElement, ShapeKind } from '../../types/design';
import { rosterTemplateCsv, variantsFromCsv, variantsToCsv } from '../../lib/roster';

const FONT_GROUPS = ['Sans', 'Serif', 'Mono', 'Display'] as const;

function FontSelect({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {FONT_GROUPS.map((group) => (
          <optgroup key={group} label={group}>
            {FONTS.filter((font) => font.category === group).map((font) => (
              <option key={font.name} value={font.name}>
                {font.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

export function Inspector() {
  const design = useEditorStore((state) => state.history.present);
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const updateIdentity = useEditorStore((state) => state.updateIdentity);
  const updateTheme = useEditorStore((state) => state.updateTheme);
  const updateCard = useEditorStore((state) => state.updateCard);
  const updateQrStyle = useEditorStore((state) => state.updateQrStyle);
  const updateShare = useEditorStore((state) => state.updateShare);
  const updateContact = useEditorStore((state) => state.updateContact);
  const updateElement = useEditorStore((state) => state.updateElement);
  const renameDesign = useEditorStore((state) => state.renameDesign);
  const selectElement = useEditorStore((state) => state.selectElement);
  const reorderElement = useEditorStore((state) => state.reorderElement);
  const addElement = useEditorStore((state) => state.addElement);
  const addImageAsset = useEditorStore((state) => state.addImageAsset);
  const addContact = useEditorStore((state) => state.addContact);
  const removeContact = useEditorStore((state) => state.removeContact);
  const addVariant = useEditorStore((state) => state.addVariant);
  const applyVariant = useEditorStore((state) => state.applyVariant);
  const importVariants = useEditorStore((state) => state.importVariants);
  const switchTemplate = useEditorStore((state) => state.switchTemplate);
  const swapSides = useEditorStore((state) => state.swapSides);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const rosterRef = useRef<HTMLInputElement | null>(null);

  const contrast = contrastRatio(design.theme.text, design.theme.surface);
  const palette = paletteFromSeed(design.theme.brand);
  const selected = design.elements.find((element) => element.id === selectedIds[0]);

  async function handleExport(kind: 'pdf' | 'png' | 'svg' | 'vcf' | 'json' | 'qr') {
    try {
      if (kind === 'pdf') {
        const { exportPdf } = await import('../../exporters/pdf');
        downloadBlob(await exportPdf(design), `${design.meta.slug}.pdf`);
      } else if (kind === 'png') {
        const { exportPng } = await import('../../exporters/png');
        downloadBlob(await exportPng(design, 300), `${design.meta.slug}.png`);
      } else if (kind === 'svg') {
        const { exportSvgBundle } = await import('../../exporters/svg');
        downloadText(await exportSvgBundle(design), `${design.meta.slug}.svg`, 'image/svg+xml');
      } else if (kind === 'vcf') {
        downloadText(createVCard(design), `${design.meta.slug}.vcf`, 'text/vcard');
      } else if (kind === 'json') {
        downloadText(JSON.stringify(design, null, 2), `${design.meta.slug}.cardforge.json`, 'application/json');
      } else if (kind === 'qr') {
        const { exportQrSvg } = await import('../../exporters/qr-svg');
        const data = await exportQrSvg(design);
        downloadText(data, `${design.meta.slug}-qr.svg`, 'image/svg+xml');
      }
      toast(`${kind.toUpperCase()} exported`);
    } catch (error) {
      console.error(error);
      toast(`${kind.toUpperCase()} export failed`, 'error');
    }
  }

  async function handleAssetUpload(file: File | null) {
    if (!file) return;
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast('Use PNG, JPG, or WEBP. SVG uploads are blocked for safety.', 'error');
      return;
    }
    if (file.size > 3_000_000) {
      toast('Image is larger than 3 MB', 'error');
      return;
    }
    const bitmap = await createImageBitmap(file);
    if (bitmap.width > 6000 || bitmap.height > 6000 || bitmap.width * bitmap.height > 24_000_000) {
      bitmap.close();
      toast('Image dimensions are too large', 'error');
      return;
    }
    bitmap.close();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    addImageAsset({ name: file.name, mime: file.type, dataUrl });
    toast('Image added');
  }

  async function copyShareUrl() {
    try {
      await navigator.clipboard.writeText(buildShareUrl(design));
      toast('Share link copied');
    } catch {
      toast('Could not copy link', 'error');
    }
  }

  function save() {
    void saveDesign(design);
    toast('Design saved locally');
  }

  async function importRoster(file: File | null) {
    if (!file) return;
    try {
      const variants = variantsFromCsv(await file.text(), design);
      if (!variants.length) throw new Error('No people were found');
      importVariants(variants);
      toast(`${variants.length} people imported`);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Roster import failed', 'error');
    }
  }

  async function exportRosterPdf() {
    try {
      const { exportRosterPdf: buildRosterPdf } = await import('../../exporters/pdf');
      downloadBlob(await buildRosterPdf(design), `${design.meta.slug}-roster.pdf`);
      toast(`${design.variants.length} cards exported to PDF`);
    } catch (error) {
      console.error(error);
      toast('Roster PDF export failed', 'error');
    }
  }

  return (
    <aside className="inspector" aria-label="Card inspector">
      <div className="inspector-head">
        <input
          className="design-name"
          aria-label="Design name"
          value={design.meta.name}
          onChange={(event) => renameDesign(event.target.value)}
        />
        <div className="inspector-actions">
          <button type="button" className="icon-button" onClick={undo} aria-label="Undo" title="Undo (Ctrl+Z)"><Undo2 size={16} /></button>
          <button type="button" className="icon-button" onClick={redo} aria-label="Redo" title="Redo (Ctrl+Shift+Z)"><Redo2 size={16} /></button>
          <button type="button" className="icon-button" onClick={swapSides} aria-label="Swap front and back" title="Swap sides"><Shuffle size={16} /></button>
          <button type="button" className="primary-button" onClick={save}><Save size={15} />Save</button>
        </div>
      </div>

      <div className="insert-bar" role="group" aria-label="Insert elements">
        <button type="button" onClick={() => addElement('text')}><Type size={15} />Text</button>
        <button type="button" onClick={() => addElement('shape')}><Shapes size={15} />Shape</button>
        <button type="button" onClick={() => fileRef.current?.click()}><ImagePlus size={15} />Image</button>
        <button type="button" onClick={() => addElement('qr')}><QrCode size={15} />QR</button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={(event) => {
            void handleAssetUpload(event.target.files?.[0] ?? null);
            event.target.value = '';
          }}
        />
      </div>

      {selected ? <SelectedPanel element={selected} /> : null}

      <details open>
        <summary><SlidersHorizontal size={16} /> Layout & size</summary>
        <label>Template<select value={design.meta.templateId} onChange={(event) => switchTemplate(event.target.value)}>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label>
        <div className="two-grid">
          <label>Size<select value={design.card.preset} onChange={(event) => updateCard({ preset: event.target.value as typeof design.card.preset })}>{Object.entries(CARD_PRESETS).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}</select></label>
          <label>Orientation<select value={design.card.orientation} onChange={(event) => updateCard({ orientation: event.target.value as typeof design.card.orientation })}><option value="landscape">Landscape</option><option value="portrait">Portrait</option></select></label>
        </div>
        <div className="two-grid">
          <label>Corner radius<input type="range" min="0" max="28" value={design.card.cornerRadius} onChange={(event) => updateCard({ cornerRadius: Number(event.target.value) })} /></label>
          <label>Bleed (mm)<input type="number" min="0" max="6" step="0.5" value={design.card.bleedMm} onChange={(event) => updateCard({ bleedMm: Number(event.target.value) })} /></label>
        </div>
        <div className="two-grid">
          <label>Finish<select value={design.card.finish} onChange={(event) => updateCard({ finish: event.target.value as typeof design.card.finish })}><option value="matte">Matte</option><option value="glossy">Glossy</option></select></label>
          <label className="check-label"><input type="checkbox" checked={design.card.safeAreaVisible} onChange={(event) => updateCard({ safeAreaVisible: event.target.checked })} /> Safe area guide</label>
        </div>
      </details>

      <details open>
        <summary><Type size={16} /> Identity</summary>
        <label>Name<input value={design.identity.name} onChange={(event) => updateIdentity({ name: event.target.value })} /></label>
        <div className="two-grid">
          <label>Title<input value={design.identity.title} onChange={(event) => updateIdentity({ title: event.target.value })} /></label>
          <label>Pronouns<input value={design.identity.pronouns} onChange={(event) => updateIdentity({ pronouns: event.target.value })} /></label>
        </div>
        <div className="two-grid">
          <label>Company<input value={design.identity.company} onChange={(event) => updateIdentity({ company: event.target.value })} /></label>
          <label>Department<input value={design.identity.department} onChange={(event) => updateIdentity({ department: event.target.value })} /></label>
        </div>
        <label>Tagline<textarea value={design.identity.tagline} onChange={(event) => updateIdentity({ tagline: event.target.value })} /></label>
      </details>

      <details open>
        <summary><LinkIcon size={16} /> Contact</summary>
        {design.contacts.map((contact) => (
          <div className="row-editor" key={contact.id}>
            <select value={contact.kind} onChange={(event) => updateContact(contact.id, { kind: event.target.value as typeof contact.kind })}>
              <option value="phone">Phone</option>
              <option value="email">Email</option>
              <option value="website">Website</option>
              <option value="address">Address</option>
              <option value="social">Social</option>
            </select>
            <input aria-label="Contact label" placeholder="Label" value={contact.label} onChange={(event) => updateContact(contact.id, { label: event.target.value })} />
            <input aria-label="Contact value" placeholder="Value" value={contact.value} onChange={(event) => updateContact(contact.id, { value: event.target.value })} />
            <button type="button" className="icon-button" onClick={() => removeContact(contact.id)} aria-label="Remove contact"><Trash2 size={15} /></button>
          </div>
        ))}
        <button type="button" className="ghost-button" onClick={addContact}><Plus size={15} /> Add row</button>
      </details>

      <details open>
        <summary><QrCode size={16} /> QR style</summary>
        <div className="align-row" role="group" aria-label="QR module style">
          {(['square', 'rounded', 'dots'] as const).map((pattern) => (
            <button key={pattern} type="button" className={`chip ${design.qrStyle.pattern === pattern ? 'on' : ''}`} onClick={() => updateQrStyle({ pattern })}>{pattern}</button>
          ))}
        </div>
        <div className="two-grid">
          <label>Ink<input type="color" value={design.qrStyle.foreground} onChange={(event) => updateQrStyle({ foreground: event.target.value })} /></label>
          <label>Paper<input type="color" value={design.qrStyle.background} onChange={(event) => updateQrStyle({ background: event.target.value })} /></label>
        </div>
        <div className="two-grid">
          <label>Quiet zone<select value={design.qrStyle.margin} onChange={(event) => updateQrStyle({ margin: Number(event.target.value) })}><option value="1">Tight</option><option value="2">Standard</option><option value="3">Roomy</option></select></label>
          <label>Error correction<select value={design.qrStyle.errorCorrection} onChange={(event) => updateQrStyle({ errorCorrection: event.target.value as typeof design.qrStyle.errorCorrection })}><option value="L">Low</option><option value="M">Medium</option><option value="Q">Quartile</option><option value="H">High</option></select></label>
        </div>
        <label className="check-label"><input type="checkbox" checked={design.qrStyle.centerMark} onChange={(event) => updateQrStyle({ centerMark: event.target.checked, errorCorrection: event.target.checked ? 'H' : design.qrStyle.errorCorrection })} /> Add company initial</label>
        <p className="muted">Print-test custom QR codes at their final size before ordering cards.</p>
      </details>

      <details open>
        <summary><Type size={16} /> Typography</summary>
        <div className="two-grid">
          <FontSelect label="Heading" value={design.theme.headingFont} onChange={(value) => updateTheme({ headingFont: value, bodyFont: FONT_PAIRINGS[value] ?? design.theme.bodyFont })} />
          <FontSelect label="Body" value={design.theme.bodyFont} onChange={(value) => updateTheme({ bodyFont: value })} />
        </div>
        <div className="two-grid">
          <label>Scale<input type="range" min="0.8" max="1.35" step="0.01" value={design.theme.typeScale} onChange={(event) => updateTheme({ typeScale: Number(event.target.value) })} /></label>
          <label>Weight<input type="range" min="400" max="800" step="50" value={design.theme.weight} onChange={(event) => updateTheme({ weight: Number(event.target.value) })} /></label>
        </div>
        <div className="two-grid">
          <label>Tracking<input type="range" min="-0.5" max="3" step="0.1" value={design.theme.letterSpacing} onChange={(event) => updateTheme({ letterSpacing: Number(event.target.value) })} /></label>
          <label>Line height<input type="range" min="1" max="1.6" step="0.02" value={design.theme.lineHeight} onChange={(event) => updateTheme({ lineHeight: Number(event.target.value) })} /></label>
        </div>
      </details>

      <details open>
        <summary><Palette size={16} /> Color</summary>
        <div className="color-grid">
          <label className="color-chip">Brand<input type="color" value={design.theme.brand} onChange={(event) => updateTheme({ brand: event.target.value })} /></label>
          <label className="color-chip">Surface<input type="color" value={design.theme.surface} onChange={(event) => updateTheme({ surface: event.target.value })} /></label>
          <label className="color-chip">Text<input type="color" value={design.theme.text} onChange={(event) => updateTheme({ text: event.target.value })} /></label>
          <label className="color-chip">Accent<input type="color" value={design.theme.accent} onChange={(event) => updateTheme({ accent: event.target.value })} /></label>
        </div>
        <div className="palette-row">{palette.map((color) => <button key={color} type="button" style={{ background: color }} aria-label={`Use ${color} as brand`} onClick={() => updateTheme({ brand: color })} />)}</div>
        <p className={passesAA(design.theme.text, design.theme.surface) ? 'ok' : 'warning'}>
          Text contrast {contrast}:1 — WCAG AA {passesAA(design.theme.text, design.theme.surface) ? 'passes' : 'fails'}
        </p>
      </details>

      <details open>
        <summary><Layers size={16} /> Layers</summary>
        <div className="layer-list">
          {[...design.elements].sort((a, b) => b.z - a.z).map((element) => (
            <div className={selectedIds.includes(element.id) ? 'layer-row selected' : 'layer-row'} key={element.id}>
              <button type="button" className="layer-name" onClick={() => selectElement(element.id)}>
                <span className={`layer-side side-${element.side}`}>{element.side === 'front' ? 'F' : 'B'}</span>
                {element.label}
              </button>
              <button type="button" className="icon-button" aria-label={`${element.hidden ? 'Show' : 'Hide'} ${element.label}`} onClick={() => updateElement(element.id, { hidden: !element.hidden })}>
                {element.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button type="button" className="icon-button" aria-label={`${element.locked ? 'Unlock' : 'Lock'} ${element.label}`} onClick={() => updateElement(element.id, { locked: !element.locked })}>
                {element.locked ? <Lock size={14} /> : <Unlock size={14} />}
              </button>
              <button type="button" className="icon-button" aria-label={`Move ${element.label} down`} onClick={() => reorderElement(element.id, -1)}>−</button>
              <button type="button" className="icon-button" aria-label={`Move ${element.label} up`} onClick={() => reorderElement(element.id, 1)}>+</button>
            </div>
          ))}
        </div>
      </details>

      <details open>
        <summary><Users size={16} /> Team & roster <span className="kind-tag">{design.variants.length}</span></summary>
        <p className="muted">Reuse this layout for a class, cohort, program, or team. CSV processing stays on this device.</p>
        <div className="variant-list">
          {design.variants.map((variant) => (
            <button key={variant.id} type="button" className="ghost-button" onClick={() => applyVariant(variant.id)}>{variant.name}</button>
          ))}
        </div>
        <button type="button" className="ghost-button" onClick={addVariant}><Plus size={15} /> Save current as variant</button>
        <div className="roster-actions">
          <button type="button" className="ghost-button" onClick={() => downloadText(rosterTemplateCsv(), 'cardforge-roster-template.csv', 'text/csv')}><FileSpreadsheet size={15} />CSV template</button>
          <button type="button" className="ghost-button" onClick={() => rosterRef.current?.click()}><FileSpreadsheet size={15} />Import roster</button>
          <button type="button" className="ghost-button" onClick={() => downloadText(variantsToCsv(design.variants), `${design.meta.slug}-roster.csv`, 'text/csv')}><Download size={15} />Export CSV</button>
          <button type="button" className="primary-button" onClick={() => void exportRosterPdf()}><Download size={15} />Roster PDF</button>
        </div>
        <input ref={rosterRef} type="file" accept="text/csv,.csv" hidden onChange={(event) => { void importRoster(event.target.files?.[0] ?? null); event.target.value = ''; }} />
      </details>

      <details open>
        <summary><ShieldCheck size={16} /> Privacy & sharing</summary>
        <p className="trust-note"><ShieldCheck size={15} /> Only the fields enabled below are placed in a share link.</p>
        <div className="share-toggle-grid">
          {([
            ['includeEmail', 'Email'], ['includePhone', 'Phone'], ['includeWebsite', 'Website'], ['includeSocial', 'Social links'],
            ['includeAddress', 'Address'], ['includePronouns', 'Pronouns'], ['includeTagline', 'Tagline'], ['includeImages', 'Uploaded images']
          ] as const).map(([key, label]) => (
            <label className="check-label" key={key}><input type="checkbox" checked={design.share[key]} onChange={(event) => updateShare({ [key]: event.target.checked })} /> {label}</label>
          ))}
        </div>
        <label>Link expiry<select value={design.share.expiresAt ? 'dated' : 'never'} onChange={(event) => {
          const days = Number(event.target.value);
          updateShare({ expiresAt: Number.isFinite(days) ? new Date(Date.now() + days * 86_400_000).toISOString() : null });
        }}><option value="never">Never</option><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option>{design.share.expiresAt ? <option value="dated">{new Date(design.share.expiresAt).toLocaleDateString()}</option> : null}</select></label>
        <label className="check-label"><input type="checkbox" checked={design.share.allowVcard} onChange={(event) => updateShare({ allowVcard: event.target.checked })} /> Let recipients save a vCard</label>
        <button type="button" className="primary-button full" onClick={() => void copyShareUrl()}><LinkIcon size={15} />Copy digital card link</button>
      </details>

      <details open>
        <summary><Download size={16} /> Export</summary>
        <div className="export-grid">
          {(['pdf', 'png', 'svg', 'vcf', 'qr', 'json'] as const).map((kind) => (
            <button key={kind} type="button" className="ghost-button" onClick={() => void handleExport(kind)}><Download size={14} />{kind.toUpperCase()}</button>
          ))}
        </div>
        <p className="muted">PDF ships with bleed + crop marks for professional printing.</p>
      </details>
    </aside>
  );
}

function SelectedPanel({ element }: { element: DesignElement }) {
  const design = useEditorStore((state) => state.history.present);
  const updateElement = useEditorStore((state) => state.updateElement);
  const deleteSelected = useEditorStore((state) => state.deleteSelected);
  const duplicateSelected = useEditorStore((state) => state.duplicateSelected);
  const bringToFront = useEditorStore((state) => state.bringToFront);
  const sendToBack = useEditorStore((state) => state.sendToBack);
  const patch = (value: Partial<DesignElement>) => updateElement(element.id, value);

  return (
    <details open className="selected-panel">
      <summary><Square size={16} /> {element.label} <span className="kind-tag">{element.kind}</span></summary>
      <div className="selected-actions">
        <button type="button" className="ghost-button" onClick={duplicateSelected} title="Duplicate (Ctrl+D)"><Copy size={14} />Duplicate</button>
        <button type="button" className="ghost-button" onClick={() => bringToFront(element.id)} title="Bring to front"><ArrowUpToLine size={14} />Front</button>
        <button type="button" className="ghost-button" onClick={() => sendToBack(element.id)} title="Send to back"><ArrowDownToLine size={14} />Back</button>
        <button type="button" className="ghost-button danger" onClick={deleteSelected} title="Delete (Del)"><Trash2 size={14} />Delete</button>
      </div>

      <label>Label<input value={element.label} onChange={(event) => patch({ label: event.target.value })} /></label>
      <div className="quad-grid">
        <label>X<input type="number" value={element.x} onChange={(event) => patch({ x: Number(event.target.value) })} /></label>
        <label>Y<input type="number" value={element.y} onChange={(event) => patch({ y: Number(event.target.value) })} /></label>
        <label>W<input type="number" value={element.width} onChange={(event) => patch({ width: Number(event.target.value) })} /></label>
        <label>H<input type="number" value={element.height} onChange={(event) => patch({ height: Number(event.target.value) })} /></label>
      </div>
      <div className="two-grid">
        <label>Rotation<input type="range" min="-180" max="180" value={element.rotation} onChange={(event) => patch({ rotation: Number(event.target.value) })} /></label>
        <label>Opacity<input type="range" min="0" max="1" step="0.05" value={element.opacity ?? 1} onChange={(event) => patch({ opacity: Number(event.target.value) })} /></label>
      </div>
      <label>Side<select value={element.side} onChange={(event) => patch({ side: event.target.value as typeof element.side })}><option value="front">Front</option><option value="back">Back</option></select></label>

      {element.kind === 'text' ? (
        <>
          <label>Text<textarea value={element.text ?? ''} onChange={(event) => patch({ text: event.target.value })} /></label>
          <div className="two-grid">
            <label>Font size<input type="number" min="6" max="72" value={element.fontSize ?? 12} onChange={(event) => patch({ fontSize: Number(event.target.value) })} /></label>
            <label>Weight<input type="number" min="300" max="900" step="100" value={element.fontWeight ?? design.theme.weight} onChange={(event) => patch({ fontWeight: Number(event.target.value) })} /></label>
          </div>
          <FontSelect label="Font" value={element.fontFamily ?? design.theme.bodyFont} onChange={(value) => patch({ fontFamily: value })} />
          <div className="align-row" role="group" aria-label="Text alignment">
            {(['left', 'center', 'right'] as Alignment[]).map((align) => (
              <button key={align} type="button" className={`chip ${(element.align ?? 'left') === align ? 'on' : ''}`} onClick={() => patch({ align })}>{align}</button>
            ))}
          </div>
          <label>Color<input type="color" value={element.fill ?? design.theme.text} onChange={(event) => patch({ fill: event.target.value })} /></label>
        </>
      ) : null}

      {element.kind === 'shape' ? (
        <>
          <div className="align-row" role="group" aria-label="Shape type">
            {(['rect', 'ellipse', 'line'] as ShapeKind[]).map((shape) => (
              <button key={shape} type="button" className={`chip ${(element.shape ?? 'rect') === shape ? 'on' : ''}`} onClick={() => patch({ shape })}>{shape}</button>
            ))}
          </div>
          <label className="check-label">
            <input
              type="checkbox"
              checked={Boolean(element.gradient)}
              onChange={(event) => patch({ gradient: event.target.checked ? [element.fill ?? design.theme.brand, design.theme.accent] : undefined })}
            />{' '}
            Gradient fill
          </label>
          {element.gradient ? (
            <div className="two-grid">
              <label>From<input type="color" value={element.gradient[0]} onChange={(event) => patch({ gradient: [event.target.value, element.gradient![1]] })} /></label>
              <label>To<input type="color" value={element.gradient[1]} onChange={(event) => patch({ gradient: [element.gradient![0], event.target.value] })} /></label>
            </div>
          ) : (
            <label>Fill<input type="color" value={element.fill ?? design.theme.brand} onChange={(event) => patch({ fill: event.target.value })} /></label>
          )}
          {element.shape !== 'line' ? (
            <label>Corner radius<input type="range" min="0" max="60" value={element.radius ?? 8} onChange={(event) => patch({ radius: Number(event.target.value) })} /></label>
          ) : null}
        </>
      ) : null}

      {element.kind === 'image' ? (
        <label>Corner radius<input type="range" min="0" max="60" value={element.radius ?? 0} onChange={(event) => patch({ radius: Number(event.target.value) })} /></label>
      ) : null}

      {element.kind === 'qr' ? (
        <label>QR content<select value={element.qrMode ?? 'digital'} onChange={(event) => patch({ qrMode: event.target.value as NonNullable<typeof element.qrMode> })}><option value="digital">Digital card link</option><option value="vcard">vCard contact</option><option value="url">Design URL</option></select></label>
      ) : null}
    </details>
  );
}
