import { describe, expect, it } from 'vitest';
import { useEditorStore } from '../../src/editor/state/store';
import { createStarterDesign } from '../../src/editor/templates/templates';
import { normalizeDesign } from '../../src/lib/design-security';
import { qrCandidates } from '../../src/exporters/qr-value';
import { createId } from '../../src/lib/id';

describe('editor dirty tracking', () => {
  it('loading a design is not an edit; changes, undo, and slug updates are', () => {
    const store = useEditorStore.getState();
    store.setDesign(createStarterDesign());
    expect(useEditorStore.getState().dirty).toBe(false);

    useEditorStore.getState().updateIdentity({ name: 'Rae Kim' });
    expect(useEditorStore.getState().dirty).toBe(true);

    store.setDesign(createStarterDesign());
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().dirty).toBe(true);

    store.setDesign(createStarterDesign());
    useEditorStore.getState().setPublishedSlug('rae-kim');
    const next = useEditorStore.getState();
    expect(next.dirty).toBe(true);
    expect(next.history.present.meta.publishedSlug).toBe('rae-kim');
    expect(next.history.past).toHaveLength(0);
  });
});

describe('published slug', () => {
  it('survives normalization only when it is a valid hosted slug', () => {
    const design = createStarterDesign();
    expect(normalizeDesign({ ...design, meta: { ...design.meta, publishedSlug: 'ab12cd34' } })?.meta.publishedSlug).toBe('ab12cd34');
    expect(normalizeDesign({ ...design, meta: { ...design.meta, publishedSlug: '../admin' } })?.meta.publishedSlug).toBeUndefined();
    expect(normalizeDesign({ ...design, meta: { ...design.meta, publishedSlug: '-bad-' } })?.meta.publishedSlug).toBeUndefined();
  });

  it('makes the hosted short link the first QR candidate', () => {
    const design = createStarterDesign();
    const qr = design.elements.find((element) => element.kind === 'qr') ?? { ...design.elements[0], kind: 'qr' as const, qrMode: 'digital' as const };
    const published = { ...design, meta: { ...design.meta, publishedSlug: 'ab12cd34' } };
    const [first] = qrCandidates({ ...qr, qrMode: 'digital' }, published);
    expect(first).toMatch(/\/c\/ab12cd34$/);
    expect(qrCandidates({ ...qr, qrMode: 'digital' }, design)[0]).toContain('#d=');
  });
});

describe('createId', () => {
  it('produces unique, prefixed ids', () => {
    const ids = new Set(Array.from({ length: 500 }, () => createId('design')));
    expect(ids.size).toBe(500);
    for (const id of ids) expect(id).toMatch(/^design_[a-z0-9]+_[a-z0-9]+$/);
  });
});
