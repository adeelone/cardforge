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
    <h2>Scope and operator</h2><p>This notice covers the open-source CardForge static application. The project is maintained through its public GitHub repository and does not represent an incorporated cloud service, school records system, or data broker.</p>
    <h2>Data stored on this device</h2><p>Card designs, uploaded raster images, variants, and preferences are stored in IndexedDB or localStorage in your browser. CardForge has no user account service in the current release.</p>
    <h2>Network activity and hosting logs</h2><p>The app does not send designs, analytics, advertising identifiers, or telemetry to CardForge or third-party providers. The hosting provider still receives ordinary request information such as IP address, timestamp, requested path, and browser metadata under its own privacy terms.</p>
    <h2>Cookies and tracking</h2><p>CardForge sets no advertising, analytics, authentication, or cross-site tracking cookies. Theme and unit preferences use first-party localStorage. The app does not load session replay, tracking pixels, or third-party fonts.</p>
    <h2>Share links</h2><p>New digital-card links place a compressed copy of selected fields in the URL fragment, which browsers do not send in the HTTP request to the host. The payload is encoded, not encrypted. Anyone with the link may read or forward it. Older query-string links remain readable for compatibility and may appear in hosting logs.</p>
    <h2>Retention and deletion</h2><p>Local designs remain until you delete them, clear site data, or the browser removes storage. PDF, PNG, SVG, vCard, QR, and JSON exports are created on your device and remain wherever you save or send them. Settings &gt; Delete all local data removes CardForge designs, preferences, caches, and its service-worker registration for this app.</p>
    <h2>Schools, minors, and sensitive data</h2><p>CardForge is not a student-information system and is not represented as FERPA, COPPA, HIPAA, or records-retention compliant. Organizations are responsible for consent, policy review, supervision, and deciding which fields may be used. Do not place passwords, government identifiers, health records, financial data, or other sensitive records in a card or roster.</p>
    <h2>Your choices and requests</h2><p>Because CardForge has no account database, the maintainer ordinarily has no user record to access, correct, export, or delete. Use the in-app export and deletion controls for local data. Questions can be opened in the public repository; report security matters through a private GitHub security advisory instead.</p>
    <h2>Security and changes</h2><p>Reasonable technical safeguards reduce risk but cannot guarantee absolute security. Material changes to data handling require this notice and its effective date to be updated before the changed behavior is released.</p>
  </PolicyLayout>;
}

export function TermsRoute() {
  return <PolicyLayout title="Terms of use" intro="The practical rules for using this open-source design tool.">
    <h2>Acceptance and eligibility</h2><p>By using CardForge, you agree to these terms. If you use it for a school, employer, or other organization, you confirm that you are authorized to act for that organization and to provide the information you enter.</p>
    <h2>Software license</h2><p>The source code is offered under the repository's MIT License. These product terms govern use of the hosted application and do not replace the rights granted by that license.</p>
    <h2>Your content</h2><p>You retain responsibility for names, logos, photos, contact details, trademarks, and other material you add. Use only content you are authorized to use.</p>
    <h2>Acceptable use</h2><p>Do not use CardForge to impersonate others, facilitate fraud, publish unlawful material, or create misleading credentials.</p>
    <h2>Organization and roster use</h2><p>Roster operators must obtain appropriate authorization, minimize fields, review every generated card, control exported files, and follow their own privacy, accessibility, records, procurement, and printing requirements.</p>
    <h2>Output and printing</h2><p>You are responsible for reviewing spelling, contact details, dimensions, bleed, QR scanning, accessibility, color, and print-provider requirements before ordering or publishing. Screens and printers can reproduce colors differently.</p>
    <h2>Not a credential or regulated system</h2><p>CardForge output must not be treated as an identity credential, access badge, legal record, medical document, payment instrument, or guaranteed proof of affiliation.</p>
    <h2>Third-party hosting</h2><p>Your chosen hosting, browser, print shop, file-sharing service, or link recipient may apply separate terms and privacy practices.</p>
    <h2>Availability and changes</h2><p>The hosted demo may change, be interrupted, or be withdrawn. Export backups before relying on a design. Material terms changes will be published with a new effective date.</p>
    <h2>No warranty and limited liability</h2><p>CardForge is provided as-is and as-available, without warranties of availability, fitness, merchantability, non-infringement, security, or error-free output. To the maximum extent allowed by applicable law, maintainers and contributors are not liable for indirect, incidental, special, consequential, or lost-profit damages arising from use of the app. Nothing in CardForge is legal, security, compliance, or professional printing advice.</p>
    <h2>Questions</h2><p>Use the public repository for ordinary questions and a private GitHub security advisory for vulnerabilities. Organizations should have qualified counsel review these terms before a commercial or regulated deployment.</p>
  </PolicyLayout>;
}

export function AccessibilityRoute() {
  return <PolicyLayout title="Accessibility" intro="CardForge aims to make both the editor and its output practical for more people.">
    <h2>Editor support</h2><p>Controls use accessible names, visible keyboard focus, semantic headings, reduced-motion preferences, and keyboard shortcuts for selection, movement, duplication, deletion, undo, and redo.</p>
    <h2>Design support</h2><p>The editor reports text-to-surface contrast against WCAG AA. That check does not cover every text element, image, gradient, font size, or print condition; review the complete card.</p>
    <h2>Conformance status</h2><p>The project targets WCAG 2.2 AA for its application interface but has not completed an independent conformance audit and does not claim certification.</p>
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
    <h2>Why am I seeing an older release?</h2><p>Reload once while online. Current releases check for a new service worker on open and use the network for page documents. If a managed browser still pins old data, use Settings &gt; Delete all local data and reopen the live URL.</p>
    <h2>Browser support</h2><p>Current Chrome, Edge, Firefox, and Safari are the intended targets. IndexedDB, canvas export, and native sharing behavior can differ by browser and privacy mode.</p>
  </PolicyLayout>;
}
