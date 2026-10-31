import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Cloud, Download, HeartHandshake, Layers, Link2, Palette, QrCode, ShieldCheck } from 'lucide-react';
import { templates, createStarterDesign } from '../editor/templates/templates';
import { CardSvg } from '../editor/canvas/card-svg';
import { APP_RELEASE } from '../app/release';

const FEATURES = [
  { icon: Download, title: 'Print-ready exports', body: 'PDF with true bleed and crop marks, plus PNG, SVG, and vCard — sized to real card presets.' },
  { icon: QrCode, title: 'A QR that fits your card', body: 'Choose its pattern, ink, paper, quiet zone, correction level, and optional center initial.' },
  { icon: Layers, title: 'Freeform editor', body: 'Add text, shapes, images, and QR. Drag, resize, rotate, layer, and align — every element is yours.' },
  { icon: Palette, title: 'Real typography', body: 'Ten self-hosted typefaces with curated pairings and WCAG contrast checks baked in.' },
  { icon: ShieldCheck, title: 'Share only what you mean to', body: 'Choose fields, exclude images, set an expiry, and review the trust model before sending a link.' },
  { icon: HeartHandshake, title: 'Made for real introductions', body: 'Templates for students, makers, neighborhood shops, care practices, studios, and growing teams.' }
];

export function LandingRoute() {
  const heroDesign = useMemo(() => createStarterDesign('kindred'), []);
  const showcase = useMemo(() => templates.slice(0, 6).map((template) => ({ template, design: createStarterDesign(template.id) })), []);

  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-copy">
          <p className="hero-eyebrow">Free business card maker</p>
          <h1>A business card that sounds like you.</h1>
          <p className="lede">
            CardForge is a private little print studio in your browser. Start with a thoughtful template, shape every detail,
            and leave with a card ready for the printer, your phone, or the person across the table.
          </p>
          <div className="hero-actions">
            <Link to="/new" className="primary-button large">Start designing <ArrowRight size={18} /></Link>
            <Link to="/templates" className="ghost-button large">Browse templates</Link>
          </div>
          <p className="hero-note"><ShieldCheck size={15} /> No sign-up needed. Your work stays on this device unless you choose to sync it.</p>
        </div>
        <div className="hero-preview" aria-hidden="true">
          <div className="hero-card front"><CardSvg design={heroDesign} side="front" /></div>
          <div className="hero-card back"><CardSvg design={heroDesign} side="back" /></div>
        </div>
      </section>

      <section className="feature-section">
        <div className="section-intro"><h2>Everything you need, nothing watching you.</h2><p>Design, proof, share, and export without turning your contacts into somebody else's data.</p></div>
        <div className="feature-grid">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <article className="feature-card" key={feature.title}>
                <span className="feature-icon"><Icon size={20} /></span>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="showcase">
        <div className="showcase-head">
          <h2>Start from a template</h2>
          <Link to="/templates" className="text-link">See all {templates.length} <ArrowRight size={15} /></Link>
        </div>
        <div className="showcase-grid">
          {showcase.map(({ template, design }) => (
            <Link to={`/new?template=${template.id}`} className="showcase-card" key={template.id}>
              <div className="showcase-preview"><CardSvg design={design} side="front" /></div>
              <div className="showcase-meta">
                <strong>{template.name}</strong>
                <span className="tag">{template.category}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="cloud-band" aria-labelledby="cloud-heading">
        <div className="cloud-band-copy">
          <span className="tag">CardForge Cloud</span>
          <h2 id="cloud-heading">Your card, live on the web — on your terms.</h2>
          <p>Publish a hosted card with a short link, update it after it’s printed, or switch it off in one tap. See how many people opened it without tracking any of them.</p>
          <div className="hero-actions">
            <Link to="/pricing" className="primary-button">See plans <ArrowRight size={16} /></Link>
            <Link to="/login?mode=sign-up" className="ghost-button">Create a free account</Link>
          </div>
        </div>
        <ul className="cloud-points">
          <li><Link2 size={18} /><span><strong>Short, revocable links</strong>Printed QR codes keep working when your details change.</span></li>
          <li><Cloud size={18} /><span><strong>Sync across devices</strong>Start on a laptop, finish on your phone.</span></li>
          <li><BarChart3 size={18} /><span><strong>Private analytics</strong>Daily view counts — no cookies, no IPs, no profiles.</span></li>
        </ul>
      </section>

      <section className="audience-band">
        <div><h2>One design, a whole cohort.</h2><p>Import a consented CSV roster, review each person's card, then export one print-ready PDF for the group. The roster never leaves the browser.</p></div>
        <Link to="/organizations" className="ghost-button">CardForge for schools and teams <ArrowRight size={16} /></Link>
      </section>

      <section className="guides-band" aria-labelledby="guides-heading">
        <h2 id="guides-heading">Guides for better cards</h2>
        <ul>
          <li><Link to="/blog/business-card-size-and-bleed">Business card size and bleed: the print-ready guide</Link></li>
          <li><Link to="/blog/digital-business-card-qr-code">How to make a digital business card with a QR code</Link></li>
          <li><Link to="/blog/what-to-put-on-a-business-card">What to put on a business card in 2026</Link></li>
        </ul>
        <Link to="/blog" className="text-link">All guides <ArrowRight size={15} /></Link>
      </section>

      <section className="cta">
        <h2>Make the next introduction feel like yours.</h2>
        <Link to="/new" className="primary-button large">Open the editor <ArrowRight size={18} /></Link>
      </section>

      <footer className="site-footer">
        <span>CardForge {APP_RELEASE} — local-first business card studio</span>
        <div className="footer-links">
          <Link to="/templates">Templates</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/blog">Guides</Link>
          <Link to="/library">Library</Link>
          <Link to="/settings">Settings</Link>
          <Link to="/trust">Trust</Link>
          <Link to="/organizations">For teams</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/accessibility">Accessibility</Link>
          <a href="https://github.com/adeelone/cardforge/security/advisories/new">Security</a>
        </div>
      </footer>
    </main>
  );
}
