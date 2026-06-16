import { useSearchParams } from 'react-router-dom';
import { Mail, Phone, Download } from 'lucide-react';
import { decodeSharePayload } from '../exporters/share-link';
import { createVCard } from '../exporters/vcard';
import { downloadText } from '../lib/download';

export function PublicCardRoute() {
  const [params] = useSearchParams();
  const design = decodeSharePayload(params.get('d') ?? '');

  if (!design) {
    return (
      <main className="page">
        <p className="empty">This digital card link is missing its design payload.</p>
      </main>
    );
  }

  const email = design.contacts.find((item) => item.kind === 'email')?.value;
  const phone = design.contacts.find((item) => item.kind === 'phone')?.value;

  return (
    <main className="digital-card" style={{ background: design.theme.surface, color: design.theme.text }}>
      <section>
        <p>{design.identity.company}</p>
        <h1>{design.identity.name}</h1>
        <h2>{design.identity.title}</h2>
        <p>{design.identity.tagline}</p>
        <div className="hero-actions">
          {email ? <a href={`mailto:${email}`}><Mail size={17} />Email</a> : null}
          {phone ? <a href={`tel:${phone}`}><Phone size={17} />Call</a> : null}
          <button type="button" onClick={() => downloadText(createVCard(design), `${design.meta.slug}.vcf`, 'text/vcard')}><Download size={17} />Save contact</button>
        </div>
      </section>
    </main>
  );
}
