import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from '../../src/editor/state/store';
import { createStarterDesign } from '../../src/editor/templates/templates';

function reset() {
  useEditorStore.getState().setDesign(createStarterDesign());
}

describe('editor store element operations', () => {
  beforeEach(reset);

  it('adds a text element and selects it', () => {
    const before = useEditorStore.getState().history.present.elements.length;
    useEditorStore.getState().addElement('text');
    const state = useEditorStore.getState();
    expect(state.history.present.elements.length).toBe(before + 1);
    expect(state.selectedIds).toHaveLength(1);
    const added = state.history.present.elements.find((element) => element.id === state.selectedIds[0]);
    expect(added?.kind).toBe('text');
  });

  it('duplicates and deletes selected elements', () => {
    useEditorStore.getState().addElement('shape');
    const afterAdd = useEditorStore.getState().history.present.elements.length;
    useEditorStore.getState().duplicateSelected();
    expect(useEditorStore.getState().history.present.elements.length).toBe(afterAdd + 1);
    useEditorStore.getState().deleteSelected();
    expect(useEditorStore.getState().history.present.elements.length).toBe(afterAdd);
  });

  it('does not delete locked elements', () => {
    useEditorStore.getState().addElement('shape');
    const id = useEditorStore.getState().selectedIds[0];
    useEditorStore.getState().updateElement(id, { locked: true });
    const count = useEditorStore.getState().history.present.elements.length;
    useEditorStore.getState().setSelection([id]);
    useEditorStore.getState().deleteSelected();
    expect(useEditorStore.getState().history.present.elements.length).toBe(count);
  });

  it('collapses a live transform into a single undo step', () => {
    useEditorStore.getState().addElement('shape');
    const id = useEditorStore.getState().selectedIds[0];
    const pastBefore = useEditorStore.getState().history.past.length;
    const store = useEditorStore.getState();
    store.beginTransform();
    store.liveTransform([{ id, patch: { x: 10 } }]);
    store.liveTransform([{ id, patch: { x: 20 } }]);
    store.liveTransform([{ id, patch: { x: 30 } }]);
    store.endTransform();
    const after = useEditorStore.getState();
    expect(after.history.past.length).toBe(pastBefore + 1);
    expect(after.history.present.elements.find((element) => element.id === id)?.x).toBe(30);
    after.undo();
    expect(useEditorStore.getState().history.present.elements.find((element) => element.id === id)?.x).not.toBe(30);
  });
});
