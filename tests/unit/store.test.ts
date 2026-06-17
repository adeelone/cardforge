import { describe, expect, it } from 'vitest';
import { useEditorStore } from '../../src/editor/state/store';
import { createStarterDesign } from '../../src/editor/templates/templates';

describe('editor store', () => {
  it('adds uploaded images as selectable design elements', () => {
    const store = useEditorStore.getState();
    store.setDesign(createStarterDesign());
    useEditorStore.getState().addImageAsset({ name: 'logo.png', mime: 'image/png', dataUrl: 'data:image/png;base64,AAAA' });

    const next = useEditorStore.getState();
    expect(next.history.present.assets).toHaveLength(1);
    expect(next.history.present.elements.some((element) => element.kind === 'image')).toBe(true);
    expect(next.selectedIds).toHaveLength(1);
  });
});
