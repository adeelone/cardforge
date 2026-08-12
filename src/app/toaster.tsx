import { CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';
import { useToastStore } from '../lib/toast';

const ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info
};

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);
  if (!toasts.length) return null;
  return (
    <div className="toaster" role="status" aria-live="polite">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.tone];
        return (
          <div className={`toast toast-${toast.tone}`} key={toast.id}>
            <Icon size={17} aria-hidden="true" />
            <span>{toast.message}</span>
            <button type="button" className="toast-close" aria-label="Dismiss" onClick={() => dismiss(toast.id)}>
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
