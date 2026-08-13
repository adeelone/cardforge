import { Link } from 'react-router-dom';
import { Building2, CheckCircle2, FileSpreadsheet, GraduationCap, Printer, ShieldCheck, Users } from 'lucide-react';

const USE_CASES = [
  { icon: GraduationCap, title: 'Schools and career programs', body: 'Give a cohort one approved visual system, import student details from CSV, and export consistent cards for career fairs, capstones, and demo days.' },
  { icon: Building2, title: 'Small businesses', body: 'Keep a shared brand style for owners, staff, locations, and seasonal teams without buying a design seat for every person.' },
  { icon: Users, title: 'Accelerators and communities', body: 'Help founders and members leave a workshop with both a print-ready card and a privacy-reviewed digital introduction.' }
];

export function OrganizationsRoute() {
  return (
    <main className="page organizations-page">
      <header className="org-hero">
        <div>
          <h1>One thoughtful card system for a whole group.</h1>
          <p>CardForge turns one approved design into a local roster workflow for classes, cohorts, teams, and small organizations. No participant account or contact upload is required.</p>
          <div className="page-actions"><Link to="/new?template=campus" className="primary-button">Start a pilot</Link><Link to="/sharing" className="ghost-button">Review data sharing</Link></div>
        </div>
        <div className="org-workflow" aria-label="Organization workflow">
          <span><FileSpreadsheet size={18} /><strong>Import roster</strong><small>CSV stays local</small></span>
          <span><CheckCircle2 size={18} /><strong>Review variants</strong><small>One approved layout</small></span>
          <span><Printer size={18} /><strong>Export batch PDF</strong><small>Front and back per person</small></span>
        </div>
      </header>

      <section className="org-use-cases">
        {USE_CASES.map(({ icon: Icon, title, body }) => <article key={title}><Icon size={21} /><h2>{title}</h2><p>{body}</p></article>)}
      </section>

      <section className="org-pilot">
        <div><h2>A responsible pilot can run this week</h2><p>Use CardForge as a facilitator-led tool: choose a template, approve the visual rules, import a consented roster, review every variant, scan-test the QR, and send the PDF to your chosen print partner.</p></div>
        <ol>
          <li>Choose an owner for roster accuracy and final proof approval.</li>
          <li>Collect only the fields participants want printed or shared.</li>
          <li>Use the downloadable CSV template and keep the file in approved storage.</li>
          <li>Review the generated variants and privacy toggles with participants.</li>
          <li>Print a physical proof before the full order.</li>
        </ol>
      </section>

      <section className="notice-band">
        <ShieldCheck size={24} />
        <div><h2>What the current edition is, and is not</h2><p>It is a complete local design and batch-export tool. It does not yet provide centralized accounts, SSO, approval queues, hosted short-link revocation, audit logs, or cloud roster storage. Those require a secure backend and organization agreement.</p></div>
      </section>

      <section className="org-deploy">
        <h2>Put it under your own name and domain</h2>
        <p>CardForge can be deployed as static assets on Vercel, Netlify, GitHub Pages, or your own nginx container. For a professional pilot, use Vercel or Netlify with a custom domain so the configured security headers are active.</p>
        <Link to="/trust" className="text-link">Review the security architecture</Link>
      </section>
    </main>
  );
}
