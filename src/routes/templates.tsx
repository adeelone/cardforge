import { Link } from 'react-router-dom';
import { templates } from '../editor/templates/templates';

export function TemplatesRoute() {
  return (
    <main className="page">
      <header className="page-header">
        <h1>Templates</h1>
        <p>Curated layouts with stable element IDs so identity and contact content survives every switch.</p>
      </header>
      <div className="template-grid wide">
        {templates.map((template) => (
          <article className="template-card" key={template.id}>
            <span style={{ background: template.theme.brand }} />
            <strong>{template.name}</strong>
            <p>{template.notes}</p>
            <Link to={`/new?template=${template.id}`}>Use template</Link>
          </article>
        ))}
      </div>
    </main>
  );
}
