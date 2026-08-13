import { create } from 'zustand';
import type {
  CardPreset,
  CardSide,
  ContactItem,
  Design,
  DesignElement,
  ElementKind,
  Identity,
  Theme
} from '../../types/design';
import { canvasDims, presetSize } from '../../lib/units';
import { createId, slugify } from '../../lib/id';
import { templates, createStarterDesign } from '../templates/templates';
import { pushHistory, redo, undo, type HistoryState } from './history';

interface ElementTransform {
  id: string;
  patch: Partial<DesignElement>;
}

interface EditorStore {
  history: HistoryState<Design>;
  selectedIds: string[];
  activeSide: CardSide;
  transformStart: Design | null;
  setDesign: (design: Design) => void;
  setActiveSide: (side: CardSide) => void;
  beginTransform: () => void;
  liveTransform: (updates: ElementTransform[]) => void;
  endTransform: () => void;
  updateIdentity: (patch: Partial<Identity>) => void;
  updateTheme: (patch: Partial<Theme>) => void;
  updateCard: (patch: Partial<Design['card']>) => void;
  updateQrStyle: (patch: Partial<Design['qrStyle']>) => void;
  updateShare: (patch: Partial<Design['share']>) => void;
  renameDesign: (name: string) => void;
  updateContact: (id: string, patch: Partial<ContactItem>) => void;
  addContact: () => void;
  removeContact: (id: string) => void;
  selectElement: (id: string, additive?: boolean) => void;
  setSelection: (ids: string[]) => void;
  clearSelection: () => void;
  updateElement: (id: string, patch: Partial<DesignElement>) => void;
  addElement: (kind: ElementKind, side?: CardSide) => void;
  addImageAsset: (asset: { name: string; mime: string; dataUrl: string }) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  moveSelected: (dx: number, dy: number) => void;
  reorderElement: (id: string, direction: -1 | 1) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  switchTemplate: (templateId: string) => void;
  swapSides: () => void;
  addVariant: () => void;
  applyVariant: (id: string) => void;
  importVariants: (variants: Design['variants']) => void;
  undo: () => void;
  redo: () => void;
}

function touch(design: Design): Design {
  const name = design.meta.name?.trim() || `${design.identity.name || 'Untitled'} business card`;
  return {
    ...design,
    meta: { ...design.meta, name, slug: slugify(name), updatedAt: new Date().toISOString() }
  };
}

function commit(state: EditorStore, next: Design): Pick<EditorStore, 'history'> {
  return { history: pushHistory(state.history, touch(next)) };
}

function nextZ(elements: DesignElement[]) {
  return elements.length ? Math.max(...elements.map((element) => element.z)) + 1 : 1;
}

function makeElement(kind: ElementKind, design: Design, side: CardSide): DesignElement {
  const { w, h } = canvasDims(design.card);
  const base = {
    id: createId(kind),
    side,
    kind,
    rotation: 0,
    locked: false,
    hidden: false,
    z: nextZ(design.elements)
  };
  if (kind === 'text') {
    const width = 150;
    const height = 28;
    return {
      ...base,
      label: 'Text',
      text: 'New text',
      role: 'custom',
      x: Math.round(w / 2 - width / 2),
      y: Math.round(h / 2 - height / 2),
      width,
      height,
      fontSize: 13,
      align: 'left',
      fill: design.theme.text
    };
  }
  if (kind === 'shape') {
    const size = 64;
    return {
      ...base,
      label: 'Shape',
      shape: 'rect',
      x: Math.round(w / 2 - size / 2),
      y: Math.round(h / 2 - size / 2),
      width: size,
      height: size,
      radius: 8,
      fill: design.theme.brand
    };
  }
  if (kind === 'qr') {
    const size = 56;
    return {
      ...base,
      label: 'QR code',
      qrMode: 'digital',
      x: w - size - 20,
      y: h - size - 20,
      width: size,
      height: size
    };
  }
  const size = 72;
  return {
    ...base,
    label: 'Image',
    x: Math.round(w / 2 - size / 2),
    y: Math.round(h / 2 - size / 2),
    width: size,
    height: size
  };
}

export const useEditorStore = create<EditorStore>((set) => ({
  history: { past: [], present: createStarterDesign(), future: [] },
  selectedIds: [],
  activeSide: 'front',
  transformStart: null,
  setDesign: (design) => set({ history: { past: [], present: design, future: [] }, selectedIds: [] }),
  setActiveSide: (side) => set({ activeSide: side }),
  beginTransform: () => set((state) => ({ transformStart: state.transformStart ?? state.history.present })),
  liveTransform: (updates) =>
    set((state) => {
      if (!updates.length) return {};
      const byId = new Map(updates.map((update) => [update.id, update.patch]));
      return {
        history: {
          ...state.history,
          present: {
            ...state.history.present,
            elements: state.history.present.elements.map((element) => {
              const patch = byId.get(element.id);
              return patch && !element.locked ? { ...element, ...patch } : element;
            })
          }
        }
      };
    }),
  endTransform: () =>
    set((state) => {
      const start = state.transformStart;
      if (!start) return {};
      if (start === state.history.present) return { transformStart: null };
      return {
        history: { past: [...state.history.past.slice(-59), start], present: touch(state.history.present), future: [] },
        transformStart: null
      };
    }),
  renameDesign: (name) =>
    set((state) => commit(state, { ...state.history.present, meta: { ...state.history.present.meta, name } })),
  updateIdentity: (patch) =>
    set((state) => commit(state, { ...state.history.present, identity: { ...state.history.present.identity, ...patch } })),
  updateTheme: (patch) =>
    set((state) => commit(state, { ...state.history.present, theme: { ...state.history.present.theme, ...patch } })),
  updateCard: (patch) =>
    set((state) => {
      const current = state.history.present;
      let nextCard = { ...current.card, ...patch };
      if (patch.preset || patch.orientation) {
        const preset = (patch.preset ?? nextCard.preset) as CardPreset;
        const size = presetSize(preset, nextCard.orientation);
        nextCard = { ...nextCard, ...size };
      }
      return commit(state, { ...current, card: nextCard });
    }),
  updateQrStyle: (patch) =>
    set((state) => commit(state, { ...state.history.present, qrStyle: { ...state.history.present.qrStyle, ...patch } })),
  updateShare: (patch) =>
    set((state) => commit(state, { ...state.history.present, share: { ...state.history.present.share, ...patch } })),
  updateContact: (id, patch) =>
    set((state) =>
      commit(state, {
        ...state.history.present,
        contacts: state.history.present.contacts.map((contact) => (contact.id === id ? { ...contact, ...patch } : contact))
      })
    ),
  addContact: () =>
    set((state) => {
      if (state.history.present.contacts.length >= 8) return {};
      return commit(state, {
        ...state.history.present,
        contacts: [...state.history.present.contacts, { id: createId('contact'), kind: 'social', label: 'Social', value: '' }]
      });
    }),
  removeContact: (id) =>
    set((state) => commit(state, { ...state.history.present, contacts: state.history.present.contacts.filter((item) => item.id !== id) })),
  selectElement: (id, additive = false) =>
    set((state) => ({ selectedIds: additive ? Array.from(new Set([...state.selectedIds, id])) : [id] })),
  setSelection: (ids) => set({ selectedIds: ids }),
  clearSelection: () => set({ selectedIds: [] }),
  updateElement: (id, patch) =>
    set((state) =>
      commit(state, {
        ...state.history.present,
        elements: state.history.present.elements.map((element) => (element.id === id ? { ...element, ...patch } : element))
      })
    ),
  addElement: (kind, side) =>
    set((state) => {
      const current = state.history.present;
      const element = makeElement(kind, current, side ?? state.activeSide);
      return {
        ...commit(state, { ...current, elements: [...current.elements, element] }),
        selectedIds: [element.id],
        activeSide: element.side
      };
    }),
  addImageAsset: (asset) =>
    set((state) => {
      const current = state.history.present;
      const id = createId('asset');
      const element = makeElement('image', current, state.activeSide);
      element.assetId = id;
      element.label = asset.name;
      return {
        ...commit(state, { ...current, assets: [...current.assets, { id, ...asset }], elements: [...current.elements, element] }),
        selectedIds: [element.id]
      };
    }),
  deleteSelected: () =>
    set((state) => {
      const ids = new Set(state.selectedIds);
      if (!ids.size) return {};
      return {
        ...commit(state, {
          ...state.history.present,
          elements: state.history.present.elements.filter((element) => !ids.has(element.id) || element.locked)
        }),
        selectedIds: []
      };
    }),
  duplicateSelected: () =>
    set((state) => {
      const current = state.history.present;
      const ids = new Set(state.selectedIds);
      const clones: DesignElement[] = [];
      let z = nextZ(current.elements);
      for (const element of current.elements) {
        if (!ids.has(element.id)) continue;
        clones.push({ ...element, id: createId(element.kind), x: element.x + 12, y: element.y + 12, z: z++ });
      }
      if (!clones.length) return {};
      return {
        ...commit(state, { ...current, elements: [...current.elements, ...clones] }),
        selectedIds: clones.map((clone) => clone.id)
      };
    }),
  moveSelected: (dx, dy) =>
    set((state) =>
      commit(state, {
        ...state.history.present,
        elements: state.history.present.elements.map((element) =>
          state.selectedIds.includes(element.id) && !element.locked ? { ...element, x: element.x + dx, y: element.y + dy } : element
        )
      })
    ),
  reorderElement: (id, direction) =>
    set((state) =>
      commit(state, {
        ...state.history.present,
        elements: state.history.present.elements.map((element) => (element.id === id ? { ...element, z: element.z + direction } : element))
      })
    ),
  bringToFront: (id) =>
    set((state) =>
      commit(state, {
        ...state.history.present,
        elements: state.history.present.elements.map((element) =>
          element.id === id ? { ...element, z: nextZ(state.history.present.elements) } : element
        )
      })
    ),
  sendToBack: (id) =>
    set((state) => {
      const min = Math.min(0, ...state.history.present.elements.map((element) => element.z));
      return commit(state, {
        ...state.history.present,
        elements: state.history.present.elements.map((element) => (element.id === id ? { ...element, z: min - 1 } : element))
      });
    }),
  switchTemplate: (templateId) =>
    set((state) => {
      const template = templates.find((item) => item.id === templateId);
      if (!template) return {};
      return {
        ...commit(state, {
          ...state.history.present,
          meta: { ...state.history.present.meta, templateId },
          theme: { ...template.theme },
          card: { ...state.history.present.card, cornerRadius: template.cornerRadius ?? state.history.present.card.cornerRadius },
          elements: template.elements.map((element) => ({ ...element }))
        }),
        selectedIds: []
      };
    }),
  swapSides: () =>
    set((state) =>
      commit(state, {
        ...state.history.present,
        elements: state.history.present.elements.map((element) => ({ ...element, side: element.side === 'front' ? 'back' : 'front' }))
      })
    ),
  addVariant: () =>
    set((state) => {
      const design = state.history.present;
      return commit(state, {
        ...design,
        variants: [
          ...design.variants,
          { id: createId('variant'), name: `Variant ${design.variants.length + 1}`, identity: design.identity, contacts: design.contacts }
        ]
      });
    }),
  applyVariant: (id) =>
    set((state) => {
      const variant = state.history.present.variants.find((item) => item.id === id);
      if (!variant) return {};
      return commit(state, { ...state.history.present, identity: variant.identity, contacts: variant.contacts });
    }),
  importVariants: (variants) =>
    set((state) => {
      if (!variants.length) return {};
      const bounded = variants.slice(0, 250);
      return commit(state, {
        ...state.history.present,
        variants: bounded,
        identity: bounded[0].identity,
        contacts: bounded[0].contacts
      });
    }),
  undo: () => set((state) => ({ history: undo(state.history) })),
  redo: () => set((state) => ({ history: redo(state.history) }))
}));
