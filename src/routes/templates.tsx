import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { templates, createStarterDesign, type TemplateCategory } from '../editor/templates/templates';
import { CardSvg } from '../editor/canvas/card-svg';

const FILTERS: ('All' | TemplateCategory)[] = ['All', ...Array.from(new Set(templates.map((template) => template.category)))];

export function TemplatesRoute() {
  const [filter, setFilter] = useState<'All' | TemplateCategory>('All');
  const [query, setQuery] = useState('');
  const previews = useMemo(() => templates.map((template) => ({ template, design: createStarterDesign(template.id) })), []);
  const visible = previews.filter(({ template }) => {
    const matchesFilter = filter === 'All' || template.category === filter;
    const needle = query.trim().toLowerCase();
    return matchesFilter && (!needle || `${template.name} ${template.notes} ${template.category}`.toLowerCase().includes(needle));
  });

  return (
    <main className="page">
      <header className="page-header">
        <h1>Free business card templates</h1>
        <p>{templates.length} print-ready layouts for consultants, creatives, students, shops, and teams. Every template keeps your details when you switch, exports a PDF with bleed, and includes a scannable QR code.</p>
      </header>

      <div className="template-tools">
        <label className="search-field"><Search size={16} aria-hidden="true" /><span className="sr-only">Search templates</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search styles or professions" /></label>
      </div>

      <div className="filter-row" role="group" aria-label="Filter templates">
        {FILTERS.map((option) => (
          <button key={option} type="button" className={filter === option ? 'chip on' : 'chip'} onClick={() => setFilter(option)} aria-pressed={filter === option}>
            {option}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="empty">No templates match "{query}". Try a different word or clear the search.</p>
      ) : (
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
      )}
    </main>
  );
}
