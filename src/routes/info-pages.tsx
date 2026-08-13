import { Link } from 'react-router-dom';

function PolicyLayout({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <main className="page policy-page">
      <header className="page-header"><h1>{title}</h1><p>{intro}</p><span className="policy-date">Effective August 12, 2026</span></header>
      <article className="policy-copy">{children}</article>
      <nav className="legal-links" aria-label="Related information"><Link to="/trust">Trust Center</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/accessibility">Accessibility</Link><Link to="/help">Help</Link></nav>
    </main>
  );
}

export function PrivacyRoute() {
  return <PolicyLayout title="Privacy" intro="A plain-language account of what CardForge stores, shares, and does not collect.">
    <h2>Data stored on this device</h2><p>Card designs, uploaded raster images, variants, and preferences are stored in IndexedDB or localStorage in your browser. CardForge has no user account service in the current release.</p>
    <h2>Network activity</h2><p>The default app does not send designs, usage analytics, advertising identifiers, or telemetry to CardForge or third-party providers. Self-hosted app assets may be requested from the site host.</p>
    <h2>Share links</h2><p>Digital card links contain a compressed copy of fields you chose to include. The payload is encoded, not encrypted. Anyone with the link may read or forward it. Link expiry is enforced by the receiving CardForge app and is not remote deletion.</p>
    <h2>Exports and deletion</h2><p>PDF, PNG, SVG, vCard, QR, and JSON exports are created on your device. Delete all local data from Settings; browser controls may also clear site storage and caches.</p>
    <h2>Future services</h2><p>If accounts, hosted links, analytics, or sync are introduced, this notice must be updated before those services are enabled.</p>
  </PolicyLayout>;
}

export function TermsRoute() {
  return <PolicyLayout title="Terms of use" intro="The practical rules for using this open-source design tool.">
    <h2>Your content</h2><p>You retain responsibility for names, logos, photos, contact details, trademarks, and other material you add. Use only content you are authorized to use.</p>
    <h2>Output and printing</h2><p>You are responsible for reviewing spelling, contact details, dimensions, bleed, QR scanning, color, and print-provider requirements before ordering. Screens and printers can reproduce colors differently.</p>
    <h2>No warranty</h2><p>CardForge is provided as-is under the repository license, without warranties of availability, fitness, non-infringement, or error-free output. Nothing in the app is legal, security, or professional printing advice.</p>
    <h2>Acceptable use</h2><p>Do not use CardForge to impersonate others, facilitate fraud, publish unlawful material, or create misleading credentials.</p>
    <h2>Third-party hosting</h2><p>Your chosen hosting, browser, print shop, file-sharing service, or link recipient may apply separate terms and privacy practices.</p>
  </PolicyLayout>;
}

export function AccessibilityRoute() {
  return <PolicyLayout title="Accessibility" intro="CardForge aims to make both the editor and its output practical for more people.">
    <h2>Editor support</h2><p>Controls use accessible names, visible keyboard focus, semantic headings, reduced-motion preferences, and keyboard shortcuts for selection, movement, duplication, deletion, undo, and redo.</p>
    <h2>Design support</h2><p>The editor reports text-to-surface contrast against WCAG AA. That check does not cover every text element, image, gradient, font size, or print condition; review the complete card.</p>
    <h2>Known limitations</h2><p>Complex freeform SVG editing can be demanding with screen readers, and exported visual cards are not substitutes for an accessible HTML digital card or vCard. Custom QR designs require physical scan testing.</p>
    <h2>Feedback</h2><p>Report an accessibility issue through the repository with the page, browser, assistive technology, expected behavior, and observed result.</p>
  </PolicyLayout>;
}

export function HelpRoute() {
  return <PolicyLayout title="Help" intro="Quick answers for creating, moving, sharing, and printing your cards.">
    <h2>Where are my cards?</h2><p>Open My cards. Designs autosave to the current browser profile. Export CardForge JSON backups before clearing browser data or changing devices.</p>
    <h2>How do I move a card?</h2><p>Export its JSON from My cards, then import that file on the other device. Review uploaded images and fonts after importing.</p>
    <h2>Which export should I use?</h2><p>Use PDF for a print shop, PNG for social and previews, SVG for vector editing, vCard for contacts, QR SVG for a standalone code, and JSON for CardForge backups.</p>
    <h2>Why will a QR not scan?</h2><p>Increase its size and quiet zone, use dark ink on light paper, raise error correction, remove the center mark, and test from the final printed proof.</p>
    <h2>Browser support</h2><p>Current Chrome, Edge, Firefox, and Safari are the intended targets. IndexedDB, canvas export, and native sharing behavior can differ by browser and privacy mode.</p>
  </PolicyLayout>;
}
