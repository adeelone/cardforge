export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function pushHistory<T>(state: HistoryState<T>, next: T, limit = 60): HistoryState<T> {
  return {
    past: [...state.past.slice(Math.max(0, state.past.length - limit + 1)), state.present],
    present: next,
    future: []
  };
}

export function undo<T>(state: HistoryState<T>): HistoryState<T> {
  const previous = state.past.at(-1);
  if (!previous) return state;
  return {
    past: state.past.slice(0, -1),
    present: previous,
    future: [state.present, ...state.future]
  };
}

export function redo<T>(state: HistoryState<T>): HistoryState<T> {
  const next = state.future[0];
  if (!next) return state;
  return {
    past: [...state.past, state.present],
    present: next,
    future: state.future.slice(1)
  };
}
