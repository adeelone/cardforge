import { create } from 'zustand';

interface UpdateStore {
  available: boolean;
  markAvailable: () => void;
  dismiss: () => void;
}

/**
 * A new service worker can take control of an open tab at any moment (it's
 * installed and activated in the background). Reloading immediately would
 * silently wipe the editor's in-memory undo history and any edit still in
 * the autosave debounce window, so we surface it as a banner the user acts
 * on instead of forcing a reload out from under them.
 */
export const useUpdateStore = create<UpdateStore>((set) => ({
  available: false,
  markAvailable: () => set({ available: true }),
  dismiss: () => set({ available: false })
}));
