import { Link } from 'react-router-dom';
import { Clock3, Eye, Link2, QrCode, ShieldCheck } from 'lucide-react';

export function SharingRoute() {
  return (
    <main className="page guide-page">
      <header className="page-header"><h1>Share on your terms</h1><p>Digital cards are portable links with no account requirement. Review exactly what will travel before you send one.</p></header>
      <section className="guide-steps">
        <article><span>1</span><Eye size={20} /><h2>Choose fields</h2><p>Turn off private phone, address, social, pronoun, tagline, or image data in the editor.</p></article>
        <article><span>2</span><Clock3 size={20} /><h2>Set an expiry</h2><p>Add a 7, 30, or 90 day client-side expiry for event or campaign cards.</p></article>
        <article><span>3</span><Link2 size={20} /><h2>Copy and send</h2><p>The filtered card is compressed into the URL fragment, which is not sent to the host. No upload or CardForge account is involved.</p></article>
        <article><span>4</span><QrCode size={20} /><h2>Print-test the QR</h2><p>Scan at final size, especially after changing colors, dots, rounded modules, or the center initial.</p></article>
      </section>
      <section className="notice-band"><ShieldCheck size={22} /><div><h2>Know the boundary</h2><p>Expiry is checked by CardForge when the card opens. It cannot erase URLs, screenshots, downloads, browser history, or copies someone already made.</p></div></section>
      <div className="page-actions"><Link to="/new" className="primary-button">Open sharing controls</Link><Link to="/trust" className="ghost-button">Visit Trust Center</Link></div>
    </main>
  );
}
