import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { templates, createStarterDesign, type TemplateCategory } from '../editor/templates/templates';
import { CardSvg } from '../editor/canvas/card-svg';

const FILTERS: ('All' | TemplateCategory)[] = ['All', 'Professional', 'Minimal', 'Creative'];

export function TemplatesRoute() {
  const [filter, setFilter] = useState<'All' | TemplateCategory>('All');
  const previews = useMemo(() => templates.map((template) => ({ template, design: createStarterDesign(template.id) })), []);
  const visible = previews.filter(({ template }) => filter === 'All' || template.category === filter);

  return (
    <main className="page">
      <header className="page-header">
        <h1>Templates</h1>
        <p>Every layout keeps stable element roles, so your name and contacts survive any switch. Pick one and make it yours.</p>
      </header>

      <div className="filter-row" role="group" aria-label="Filter templates">
        {FILTERS.map((option) => (
          <button key={option} type="button" className={filter === option ? 'chip on' : 'chip'} onClick={() => setFilter(option)} aria-pressed={filter === option}>
            {option}
          </button>
        ))}
      </div>

      <div className="template-grid">
        {visible.map(({ template, design }) => (
          <article className="template-card" key={template.id}>
            <div className="template-preview"><CardSvg design={design} side="front" /></div>
            <div className="template-body">
              <div className="template-title">
                <strong>{template.name}</strong>
                <span className="tag">{template.category}</span>
              </div>
              <p>{template.notes}</p>
              <Link to={`/new?template=${template.id}`} className="primary-button full">Use template <ArrowRight size={15} /></Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
