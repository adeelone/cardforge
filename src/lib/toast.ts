import { create } from 'zustand';
import { createId } from './id';

export type ToastTone = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
}

interface ToastStore {
  toasts: Toast[];
  push: (message: string, tone?: ToastTone) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (message, tone = 'success') => {
    const id = createId('toast');
    set((state) => ({ toasts: [...state.toasts, { id, message, tone }] }));
    setTimeout(() => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })), 3200);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }))
}));

/** Fire-and-forget helper usable outside React. */
export function toast(message: string, tone: ToastTone = 'success') {
  useToastStore.getState().push(message, tone);
}
