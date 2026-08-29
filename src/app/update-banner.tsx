import { RefreshCw, X } from 'lucide-react';
import { useUpdateStore } from '../lib/update-available';

export function UpdateBanner() {
  const available = useUpdateStore((state) => state.available);
  const dismiss = useUpdateStore((state) => state.dismiss);
  if (!available) return null;

  return (
    <div className="update-banner" role="status">
      <RefreshCw size={16} aria-hidden="true" />
      <span>A new version of CardForge is ready.</span>
      <button type="button" className="ghost-button" onClick={() => window.location.reload()}>
        Reload
      </button>
      <button type="button" className="update-banner-dismiss" aria-label="Dismiss" onClick={dismiss}>
        <X size={15} />
      </button>
    </div>
  );
}
