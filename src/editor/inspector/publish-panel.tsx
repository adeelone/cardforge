import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CloudUpload, Copy, ExternalLink, Eye, Globe, Link2Off, RefreshCw, Sparkles } from 'lucide-react';
import { useEditorStore } from '../state/store';
import { cloudEnabled } from '../../lib/cloud/client';
import { useSession } from '../../lib/cloud/session';
import { isCardLive, listPublishedCards, publishCard, setCardActive, type PublishedCard } from '../../lib/cloud/api';
import { cloudErrorMessage, isPlanLimit } from '../../lib/plans';
import { HOSTED_SLUG } from '../../lib/design-security';
import { hostedCardUrl } from '../../exporters/share-link';
import { toast } from '../../lib/toast';

/** Hosted-card controls; absent entirely when CardForge Cloud isn't configured. */
export function PublishPanel() {
  return cloudEnabled ? <CloudPublishPanel /> : null;
}

function CloudPublishPanel() {
  const design = useEditorStore((state) => state.history.present);
  const setPublishedSlug = useEditorStore((state) => state.setPublishedSlug);
  const status = useSession((state) => state.status);
  const overview = useSession((state) => state.overview);
  const refreshOverview = useSession((state) => state.refreshOverview);
  const location = useLocation();
  const [card, setCard] = useState<PublishedCard | null>(null);
  const [slug, setSlug] = useState('');
  const [busy, setBusy] = useState(false);
  const [limitHit, setLimitHit] = useState(false);
  const designId = design.meta.id;
  const canCustomize = Boolean(overview?.limits.custom_slugs);

  useEffect(() => {
    if (status !== 'signed-in') return;
    let cancelled = false;
    listPublishedCards()
      .then((cards) => {
        if (cancelled) return;
        const mine = cards.find((item) => item.designId === designId) ?? null;
        setCard(mine);
        setSlug(mine?.slug ?? '');
      })
      .catch((error) => console.error(error));
    return () => {
      cancelled = true;
    };
  }, [status, designId]);

  if (status !== 'signed-in') {
    return (
      <div className="publish-panel">
        <p className="publish-title"><Globe size={15} /> Hosted card</p>
        <p className="muted">Get a short link you can update or switch off any time, and a far smaller QR code.</p>
        <Link to={`/login?next=${encodeURIComponent(location.pathname)}`} className="ghost-button full">Sign in to publish</Link>
      </div>
    );
  }

  const live = card ? isCardLive(card) : false;
  const url = card ? hostedCardUrl(card.slug) : '';
  const wantsCustom = canCustomize && slug.trim() && slug.trim() !== card?.slug;
  const slugValid = !wantsCustom || HOSTED_SLUG.test(slug.trim().toLowerCase());

  async function publish() {
    setBusy(true);
    setLimitHit(false);
    try {
      const row = await publishCard(design, { slug: wantsCustom ? slug : undefined });
      setCard(row);
      setSlug(row.slug);
      setPublishedSlug(row.slug);
      void refreshOverview();
      toast(card ? 'Live card updated' : 'Card published');
    } catch (error) {
      setLimitHit(isPlanLimit(error));
      toast(cloudErrorMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  }

  async function toggle(active: boolean) {
    if (!card) return;
    setBusy(true);
    setLimitHit(false);
    try {
      const row = await setCardActive(card.id, active);
      setCard(row);
      void refreshOverview();
      toast(active ? 'Card is live again' : 'Link switched off — it now shows “unavailable”');
    } catch (error) {
      setLimitHit(isPlanLimit(error));
      toast(cloudErrorMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast('Hosted link copied');
    } catch {
      toast('Could not copy link', 'error');
    }
  }

  return (
    <div className="publish-panel">
      <p className="publish-title">
        <Globe size={15} /> Hosted card
        {card ? <span className={live ? 'status-pill live' : 'status-pill'}>{live ? 'Live' : 'Off'}</span> : null}
      </p>
      {card ? (
        <div className="publish-url">
          <code>{url.replace(/^https?:\/\//, '')}</code>
          <button type="button" className="icon-button" onClick={() => void copy()} aria-label="Copy hosted link"><Copy size={14} /></button>
          <a className="icon-button link-button" href={url} target="_blank" rel="noreferrer" aria-label="Open hosted card"><ExternalLink size={14} /></a>
        </div>
      ) : (
        <p className="muted">Publishes only the fields enabled above. You can update or switch the link off at any time.</p>
      )}

      <label>
        <span className="label-row">Custom link {canCustomize ? null : <span className="tag">Pro</span>}</span>
        <input
          value={slug}
          onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          placeholder={canCustomize ? 'your-name' : 'Random short link'}
          disabled={!canCustomize}
          maxLength={48}
          aria-invalid={!slugValid}
        />
      </label>
      {!slugValid ? <p className="field-error">Use 3–48 lowercase letters, numbers, and dashes.</p> : null}

      <div className="publish-actions">
        <button type="button" className="primary-button" disabled={busy || !slugValid} onClick={() => void publish()}>
          {card ? <><RefreshCw size={15} />Update live card</> : <><CloudUpload size={15} />Publish card</>}
        </button>
        {card && live ? (
          <button type="button" className="ghost-button danger" disabled={busy} onClick={() => void toggle(false)}><Link2Off size={15} />Switch off</button>
        ) : null}
        {card && !card.isActive ? (
          <button type="button" className="ghost-button" disabled={busy} onClick={() => void toggle(true)}>Turn back on</button>
        ) : null}
      </div>

      {card ? <p className="muted publish-meta"><Eye size={13} /> {card.viewCount.toLocaleString()} views{design.meta.publishedSlug === card.slug ? ' · QR codes on this card point here' : ''}</p> : null}
      {limitHit ? (
        <Link to="/pricing" className="upgrade-hint"><Sparkles size={15} /> Upgrade for more live cards and custom links</Link>
      ) : null}
    </div>
  );
}
