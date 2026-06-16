import { Link } from 'react-router-dom';
import { ArrowRight, Download, QrCode, ShieldCheck } from 'lucide-react';
import { templates } from '../editor/templates/templates';

export function LandingRoute() {
  return (
    <main className="landing">
      <section className="hero">
        <div>
          <p className="eyebrow">Print and digital business cards</p>
          <h1>CardForge</h1>
          <p>
            Design a polished card, tune print specs, and export PDF, PNG, SVG, vCard, QR, and shareable digital-card links from one focused workspace.
          </p>
          <div className="hero-actions">
            <Link to="/new" className="primary-button">Start designing <ArrowRight size={17} /></Link>
            <Link to="/templates">Browse templates</Link>
          </div>
        </div>
      </section>
      <section className="feature-strip" aria-label="Highlights">
        <span><Download size={18} /> Print-ready exports</span>
        <span><QrCode size={18} /> QR and vCard built in</span>
        <span><ShieldCheck size={18} /> Local-first privacy</span>
      </section>
      <section className="template-gallery">
        <h2>Starter templates</h2>
        <div className="template-grid">
          {templates.slice(0, 6).map((template) => (
            <Link to={`/new?template=${template.id}`} className="template-card" key={template.id}>
              <span style={{ background: template.theme.brand }} />
              <strong>{template.name}</strong>
              <p>{template.notes}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
