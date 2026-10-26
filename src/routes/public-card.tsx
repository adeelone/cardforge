import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Download, Globe, Mail, MapPin, Phone, Share2, ShieldCheck } from 'lucide-react';
import { decodeSharePayload, extractSharePayload } from '../exporters/share-link';
import { createVCard } from '../exporters/vcard';
import { downloadText } from '../lib/download';
import { CardSvg } from '../editor/canvas/card-svg';
import { toast } from '../lib/toast';
import { isShareExpired, safeContactHref } from '../lib/design-security';
import { cloudEnabled } from '../lib/cloud/client';
import { getPublicCard } from '../lib/cloud/api';
import type { Design } from '../types/design';

type Hosted = { state: 'idle' | 'loading' | 'missing' | 'unavailable' | 'error' } | { state: 'ok'; design: Design; showBadge: boolean };

/** Fetch a hosted card when the URL carries no embedded payload. */
function useHostedCard(slug: string | undefined, enabled: boolean): Hosted {
  // Results are keyed by slug so a navigation never shows the previous card.
  const [loaded, setLoaded] = useState<{ slug: string; hosted: Hosted } | null>(null);
  useEffect(() => {
    if (!enabled || !slug) return;
    let cancelled = false;
    getPublicCard(slug)
      .then((result) => {
        if (cancelled) return;
        setLoaded({ slug, hosted: result.status === 'ok' ? { state: 'ok', design: result.design, showBadge: result.showBadge } : { state: result.status } });
      })
      .catch(() => !cancelled && setLoaded({ slug, hosted: { state: 'error' } }));
    return () => {
      cancelled = true;
    };
  }, [slug, enabled]);
  if (!enabled || !slug) return { state: 'idle' };
  return loaded?.slug === slug ? loaded.hosted : { state: 'loading' };
}

const CONTACT_ICON = {
  email: Mail,
  phone: Phone,
  website: Globe,
  social: Globe,
  address: MapPin
} as const;

export function PublicCardRoute() {
  const location = useLocation();
  const { slug } = useParams();
  const payload = extractSharePayload(location.search, location.hash);
  const embedded = payload ? decodeSharePayload(payload) : null;
  const hosted = useHostedCard(slug, !payload && cloudEnabled);
  const design = embedded ?? (hosted.state === 'ok' ? hosted.design : null);
  const showBadge = hosted.state === 'ok' ? hosted.showBadge : true;

  if (!design && hosted.state === 'loading') {
    return (
      <main className="page digital-empty">
        <p className="muted" role="status">Opening card…</p>
      </main>
    );
  }

  if (!design && hosted.state === 'unavailable') {
    return (
      <main className="page digital-empty">
        <ShieldCheck size={30} />
        <h1>This card is no longer available</h1>
        <p className="muted">Its owner switched this link off or let it expire. Ask them for their current card.</p>
        <Link to="/new" className="primary-button">Create your own card</Link>
      </main>
    );
  }

  if (!design) {
    return (
      <main className="page digital-empty">
        <h1>{hosted.state === 'error' ? 'We couldn’t load this card' : 'Card link is incomplete'}</h1>
        <p className="muted">{hosted.state === 'error' ? 'Check your connection and try again in a moment.' : 'This digital card link is missing or corrupted. Ask the sender to share it again.'}</p>
        <Link to="/new" className="primary-button">Create your own card</Link>
      </main>
    );
  }

  if (isShareExpired(design)) {
    return (
      <main className="page digital-empty">
        <ShieldCheck size={30} />
        <h1>This card link has expired</h1>
        <p className="muted">The sender limited how long this link could be opened. Ask them for a fresh link.</p>
        <Link to="/new" className="primary-button">Create your own card</Link>
      </main>
    );
  }

  async function shareLink() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: design!.identity.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast('Link copied');
      }
    } catch {
      /* user cancelled share */
    }
  }

  const contacts = design.contacts.filter((contact) => contact.value.trim());

  return (
    <main className="digital-card">
      <div className="digital-shell">
        <div className="digital-preview" style={{ background: design.theme.dark ? '#0c0d10' : '#eef1f4' }}>
          <CardSvg design={design} side="front" />
        </div>
        <section className="digital-body">
          <p className="digital-company">{design.identity.company}</p>
          <h1>{design.identity.name}{design.identity.pronouns ? <span className="pronouns"> ({design.identity.pronouns})</span> : null}</h1>
          <h2>{design.identity.title}</h2>
          {design.identity.tagline ? <p className="digital-tagline">{design.identity.tagline}</p> : null}

          <ul className="digital-contacts">
            {contacts.map((contact) => {
              const Icon = CONTACT_ICON[contact.kind];
              const link = safeContactHref(contact);
              return (
                <li key={contact.id}>
                  <Icon size={17} aria-hidden="true" />
                  {link ? <a href={link} target={link.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{contact.value}</a> : <span>{contact.value}</span>}
                </li>
              );
            })}
          </ul>

          <div className="digital-actions">
            {design.share.allowVcard ? (
              <button type="button" className="primary-button" onClick={() => downloadText(createVCard(design), `${design.meta.slug}.vcf`, 'text/vcard')}>
                <Download size={17} />Save contact
              </button>
            ) : null}
            <button type="button" className="ghost-button" onClick={() => void shareLink()}><Share2 size={16} />Share</button>
          </div>
          <p className="digital-trust"><ShieldCheck size={14} /> Shared by {design.identity.name}. {hosted.state === 'ok' ? 'CardForge counts views without cookies or personal data.' : 'CardForge does not track visits.'}</p>
          {showBadge ? <Link to="/new" className="digital-made">Made with CardForge — create your own →</Link> : null}
        </section>
      </div>
    </main>
  );
}
