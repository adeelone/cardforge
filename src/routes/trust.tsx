import { Link } from 'react-router-dom';
import { Database, EyeOff, FileCheck2, KeyRound, Link2, ShieldCheck } from 'lucide-react';

const CONTROLS = [
  { icon: Database, title: 'Local-first storage', body: 'Cards are saved in this browser with IndexedDB. An optional account syncs them, protected by per-user row-level security in the database.' },
  { icon: EyeOff, title: 'No tracking runtime', body: 'The production app does not load analytics, advertising pixels, third-party fonts, or session replay. Hosted cards count views per day only.' },
  { icon: Link2, title: 'Field-level sharing', body: 'Share links contain a filtered card copy. You choose whether email, phone, address, social links, pronouns, tagline, and images are included.' },
  { icon: FileCheck2, title: 'Validated imports', body: 'Imported design files and shared payloads are capped, structurally checked, and restricted to supported image formats before use.' },
  { icon: KeyRound, title: 'No browser secrets', body: 'The browser only holds a public, row-level-security-limited key. Plan limits and billing state are enforced in the database, never in client code.' },
  { icon: ShieldCheck, title: 'Defensive hosting', body: 'Deployment configs set a restrictive content policy, deny framing, disable powerful browser features, and prevent MIME sniffing.' }
];

export function TrustRoute() {
  return (
    <main className="page trust-page">
      <header className="page-header trust-header">
        <div>
          <h1>Your card is personal. The editor should respect that.</h1>
          <p>CardForge works fully without an account or a tracking profile. If you choose to sign in, only what you sync or publish leaves your device. Here is what that means in practice.</p>
        </div>
        <div className="trust-seal"><ShieldCheck size={24} /><strong>Local by default</strong><span>No telemetry</span></div>
      </header>

      <section className="trust-controls" aria-label="Security and privacy controls">
        {CONTROLS.map(({ icon: Icon, title, body }) => (
          <article key={title}>
            <Icon size={20} />
            <div><h2>{title}</h2><p>{body}</p></div>
          </article>
        ))}
      </section>

      <section className="trust-data-flow">
        <div>
          <h2>What leaves your device</h2>
          <p>Design content leaves only when you export a file, send a digital-card URL, or — if signed in — sync or publish a card to your account. The site host still receives ordinary web-request metadata when the app loads.</p>
        </div>
        <ol>
          <li><strong>You edit</strong><span>Design state stays in browser storage.</span></li>
          <li><strong>You review</strong><span>Share controls remove fields you turn off.</span></li>
          <li><strong>You send</strong><span>The filtered design is compressed into a URL fragment that is not sent to the host.</span></li>
        </ol>
      </section>

      <section className="notice-band">
        <div><h2>A share link is not a secret link</h2><p>Anyone who receives or forwards a URL can read the fields it shows. Serverless fragment links can’t be revoked; hosted cards can be updated or switched off at any time from your account.</p></div>
        <Link to="/sharing" className="ghost-button">Read the sharing guide</Link>
      </section>

      <nav className="legal-links" aria-label="Policies">
        <Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/accessibility">Accessibility</Link><Link to="/help">Help</Link>
      </nav>
    </main>
  );
}
