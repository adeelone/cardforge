import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Download, Layers, Palette, QrCode, ShieldCheck, Sparkles, Wand2 } from 'lucide-react';
import { templates, createStarterDesign } from '../editor/templates/templates';
import { CardSvg } from '../editor/canvas/card-svg';

const FEATURES = [
  { icon: Download, title: 'Print-ready exports', body: 'PDF with true bleed and crop marks, plus PNG, SVG, and vCard — sized to real card presets.' },
  { icon: QrCode, title: 'Digital cards & QR', body: 'Share a live link or QR that opens a tappable digital card and saves your contact instantly.' },
  { icon: Layers, title: 'Freeform editor', body: 'Add text, shapes, images, and QR. Drag, resize, rotate, layer, and align — every element is yours.' },
  { icon: Palette, title: 'Real typography', body: 'Ten self-hosted typefaces with curated pairings and WCAG contrast checks baked in.' },
  { icon: ShieldCheck, title: 'Private by default', body: 'Everything lives in your browser. No account, no tracking, no server — export whenever you like.' },
  { icon: Wand2, title: 'From subtle to wild', body: 'Calm professional layouts or bold gradient, neon, and oversized-type cards. Your call.' }
];

export function LandingRoute() {
  const heroDesign = useMemo(() => createStarterDesign('neon'), []);
  const showcase = useMemo(() => templates.slice(0, 6).map((template) => ({ template, design: createStarterDesign(template.id) })), []);

  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><Sparkles size={14} /> Print &amp; digital business cards</p>
          <h1>Design a card people actually keep.</h1>
          <p className="lede">
            CardForge is a focused studio for print-ready and digital business cards. Start from a professional template,
            make it unmistakably yours, and export in seconds — all in your browser.
          </p>
          <div className="hero-actions">
            <Link to="/new" className="primary-button large">Start designing <ArrowRight size={18} /></Link>
            <Link to="/templates" className="ghost-button large">Browse templates</Link>
          </div>
          <p className="hero-note">No sign-up. Works offline. Free.</p>
        </div>
        <div className="hero-preview" aria-hidden="true">
          <div className="hero-card front"><CardSvg design={heroDesign} side="front" /></div>
          <div className="hero-card back"><CardSvg design={heroDesign} side="back" /></div>
        </div>
      </section>

      <section className="feature-section">
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

      <section className="cta">
        <h2>Your next card is a few clicks away.</h2>
        <Link to="/new" className="primary-button large">Open the editor <ArrowRight size={18} /></Link>
      </section>

      <footer className="site-footer">
        <span>CardForge — local-first business card studio</span>
        <div className="footer-links">
          <Link to="/templates">Templates</Link>
          <Link to="/library">Library</Link>
          <Link to="/settings">Settings</Link>
        </div>
      </footer>
    </main>
  );
}
