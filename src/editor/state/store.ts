import { create } from 'zustand';
import type { CardPreset, ContactItem, Design, DesignElement, Identity, Theme } from '../../types/design';
import { presetSize } from '../../lib/units';
import { createId, slugify } from '../../lib/id';
import { templates, createStarterDesign } from '../templates/templates';
import { pushHistory, redo, undo, type HistoryState } from './history';

interface EditorStore {
  history: HistoryState<Design>;
  selectedIds: string[];
  setDesign: (design: Design) => void;
  updateIdentity: (patch: Partial<Identity>) => void;
  updateTheme: (patch: Partial<Theme>) => void;
  updateCard: (patch: Partial<Design['card']>) => void;
  updateContact: (id: string, patch: Partial<ContactItem>) => void;
  addContact: () => void;
  removeContact: (id: string) => void;
  selectElement: (id: string, additive?: boolean) => void;
  updateElement: (id: string, patch: Partial<DesignElement>) => void;
  moveSelected: (dx: number, dy: number) => void;
  reorderElement: (id: string, direction: -1 | 1) => void;
  switchTemplate: (templateId: string) => void;
  swapSides: () => void;
  addVariant: () => void;
  applyVariant: (id: string) => void;
  undo: () => void;
  redo: () => void;
}

function touch(design: Design): Design {
  return {
    ...design,
    meta: {
      ...design.meta,
      name: `${design.identity.name || 'Untitled'} business card`,
      slug: slugify(`${design.identity.name || 'untitled'} business card`),
      updatedAt: new Date().toISOString()
    }
  };
}

function commit(state: EditorStore, next: Design): Pick<EditorStore, 'history'> {
  return { history: pushHistory(state.history, touch(next)) };
}

export const useEditorStore = create<EditorStore>((set) => ({
  history: { past: [], present: createStarterDesign(), future: [] },
  selectedIds: [],
  setDesign: (design) => set({ history: { past: [], present: design, future: [] }, selectedIds: [] }),
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
  updateContact: (id, patch) =>
    set((state) =>
      commit(state, {
        ...state.history.present,
        contacts: state.history.present.contacts.map((contact) => (contact.id === id ? { ...contact, ...patch } : contact))
      })
    ),
  addContact: () =>
    set((state) => {
      if (state.history.present.contacts.length >= 6) return {};
      return commit(state, {
        ...state.history.present,
        contacts: [...state.history.present.contacts, { id: createId('contact'), kind: 'social', label: 'Social', value: '' }]
      });
    }),
  removeContact: (id) =>
    set((state) => commit(state, { ...state.history.present, contacts: state.history.present.contacts.filter((item) => item.id !== id) })),
  selectElement: (id, additive = false) =>
    set((state) => ({ selectedIds: additive ? Array.from(new Set([...state.selectedIds, id])) : [id] })),
  updateElement: (id, patch) =>
    set((state) =>
      commit(state, {
        ...state.history.present,
        elements: state.history.present.elements.map((element) => (element.id === id ? { ...element, ...patch } : element))
      })
    ),
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
  switchTemplate: (templateId) =>
    set((state) => {
      const template = templates.find((item) => item.id === templateId);
      if (!template) return {};
      return commit(state, {
        ...state.history.present,
        meta: { ...state.history.present.meta, templateId },
        theme: { ...template.theme, brand: state.history.present.theme.brand },
        elements: template.elements
      });
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
        variants: [...design.variants, { id: createId('variant'), name: `Variant ${design.variants.length + 1}`, identity: design.identity, contacts: design.contacts }]
      });
    }),
  applyVariant: (id) =>
    set((state) => {
      const variant = state.history.present.variants.find((item) => item.id === id);
      if (!variant) return {};
      return commit(state, { ...state.history.present, identity: variant.identity, contacts: variant.contacts });
    }),
  undo: () => set((state) => ({ history: undo(state.history) })),
  redo: () => set((state) => ({ history: redo(state.history) }))
}));
