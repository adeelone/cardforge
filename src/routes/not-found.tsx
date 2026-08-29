import { ArrowLeft, LayoutTemplate } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotFoundRoute() {
  return (
    <main className="page not-found-page">
      <p className="eyebrow">404</p>
      <h1>This page is not in the deck.</h1>
      <p>The link may be outdated, incomplete, or meant for a card that is no longer available.</p>
      <div className="not-found-actions">
        <Link to="/" className="primary-button"><ArrowLeft size={17} />Back to CardForge</Link>
        <Link to="/templates" className="ghost-button"><LayoutTemplate size={17} />Browse templates</Link>
      </div>
    </main>
  );
}
