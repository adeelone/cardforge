import { Link } from 'react-router-dom';
import { Database, EyeOff, FileCheck2, KeyRound, Link2, ShieldCheck } from 'lucide-react';

const CONTROLS = [
  { icon: Database, title: 'Local-first storage', body: 'Cards are saved in this browser with IndexedDB. There is no CardForge account database in the current app.' },
  { icon: EyeOff, title: 'No tracking runtime', body: 'The production app does not load analytics, advertising pixels, third-party fonts, or session replay.' },
  { icon: Link2, title: 'Field-level sharing', body: 'Share links contain a filtered card copy. You choose whether email, phone, address, social links, pronouns, tagline, and images are included.' },
  { icon: FileCheck2, title: 'Validated imports', body: 'Imported design files and shared payloads are capped, structurally checked, and restricted to supported image formats before use.' },
  { icon: KeyRound, title: 'No browser secrets', body: 'CardForge requires no API key. Future server integrations must keep credentials outside client-side code.' },
  { icon: ShieldCheck, title: 'Defensive hosting', body: 'Deployment configs set a restrictive content policy, deny framing, disable powerful browser features, and prevent MIME sniffing.' }
];

export function TrustRoute() {
  return (
    <main className="page trust-page">
      <header className="page-header trust-header">
        <div>
          <h1>Your card is personal. The editor should respect that.</h1>
          <p>CardForge is designed to work without an account, a tracking profile, or a private-data backend. Here is what that means in practice.</p>
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
          <p>Nothing leaves automatically. A file leaves only when you export it. A digital card leaves only when you copy and send its URL.</p>
        </div>
        <ol>
          <li><strong>You edit</strong><span>Design state stays in browser storage.</span></li>
          <li><strong>You review</strong><span>Share controls remove fields you turn off.</span></li>
          <li><strong>You send</strong><span>The filtered design is compressed into the URL.</span></li>
        </ol>
      </section>

      <section className="notice-band">
        <div><h2>A share link is not a secret link</h2><p>Anyone who receives or forwards the URL can read the fields inside it until it expires. CardForge cannot remotely revoke a serverless link.</p></div>
        <Link to="/sharing" className="ghost-button">Read the sharing guide</Link>
      </section>

      <nav className="legal-links" aria-label="Policies">
        <Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/accessibility">Accessibility</Link><Link to="/help">Help</Link>
      </nav>
    </main>
  );
}
