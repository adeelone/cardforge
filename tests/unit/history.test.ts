import { describe, expect, it } from 'vitest';
import { pushHistory, redo, undo } from '../../src/editor/state/history';

describe('history reducer', () => {
  it('undoes and redoes snapshots', () => {
    const initial = { past: [], present: 1, future: [] };
    const next = pushHistory(initial, 2);
    expect(undo(next).present).toBe(1);
    expect(redo(undo(next)).present).toBe(2);
  });
});
