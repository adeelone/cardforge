/**
 * Build-time prerender entry. `npm run build` bundles this with
 * `vite build --ssr` and scripts/postbuild.mjs calls it to write real page
 * HTML for every public route, so search engines and AI crawlers that don't
 * run JavaScript read the same content users see. The browser app still
 * mounts with createRoot and replaces this markup.
 */
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Route, Routes, StaticRouter } from 'react-router-dom';
import { LandingRoute } from './routes/landing';
import { TemplatesRoute } from './routes/templates';
import { PricingRoute } from './routes/pricing';
import { OrganizationsRoute } from './routes/organizations';
import { SharingRoute } from './routes/sharing';
import { TrustRoute } from './routes/trust';
import { AccessibilityRoute, HelpRoute, PrivacyRoute, TermsRoute } from './routes/info-pages';
import { BlogIndexRoute, BlogPostRoute } from './routes/blog';
import { getPosts, type BlogPost } from './content/blog';
import { PAGES, SITE_NAME, type PageMeta } from './app/page-meta';
import { PLANS, PLAN_ORDER, PRICING_FAQ } from './lib/plans';
import { templates } from './editor/templates/templates';
import { APP_RELEASE } from './app/release';

export { PAGES, PLANS, PLAN_ORDER, SITE_NAME, APP_RELEASE, getPosts };
export type { BlogPost, PageMeta };

const STATIC_ROUTES: Record<string, () => ReactElement> = {
  '/': () => <LandingRoute />,
  '/templates': () => <TemplatesRoute />,
  '/pricing': () => <PricingRoute />,
  '/blog': () => <BlogIndexRoute />,
  '/organizations': () => <OrganizationsRoute />,
  '/sharing': () => <SharingRoute />,
  '/trust': () => <TrustRoute />,
  '/help': () => <HelpRoute />,
  '/privacy': () => <PrivacyRoute />,
  '/terms': () => <TermsRoute />,
  '/accessibility': () => <AccessibilityRoute />
};

/** Every path the build should write static HTML for. */
export function prerenderPaths(now = new Date()) {
  return [...Object.keys(STATIC_ROUTES), ...getPosts(now).map((post) => `/blog/${post.slug}`)];
}

/** Server-render a public route's page body (the shell is rendered by postbuild). */
export function renderPage(path: string, basename = '') {
  const post = path.startsWith('/blog/') ? path.slice('/blog/'.length) : null;
  const element = post ? <BlogPostRoute /> : STATIC_ROUTES[path]?.();
  if (!element) throw new Error(`No prerender route for ${path}`);
  // BlogPostRoute reads :slug from the router, so mount it under a matching route.
  return renderToString(
    <StaticRouter basename={basename || undefined} location={`${basename}${path}`}>
      {post ? <PostRoutes>{element}</PostRoutes> : element}
    </StaticRouter>
  );
}

function PostRoutes({ children }: { children: ReactElement }) {
  return (
    <Routes>
      <Route path="/blog/:slug" element={children} />
    </Routes>
  );
}

/** schema.org JSON-LD graph for a path, combined into one script per page. */
export function structuredData(path: string, origin: string) {
  const url = (p: string) => `${origin}${p === '/' ? '/' : p}`;
  const organization = { '@type': 'Organization', '@id': `${origin}/#organization`, name: SITE_NAME, url: url('/'), logo: `${origin}/icon.svg`, sameAs: ['https://github.com/adeelone/cardforge'] };
  const website = { '@type': 'WebSite', '@id': `${origin}/#website`, name: SITE_NAME, url: url('/'), publisher: { '@id': organization['@id'] } };
  const app = {
    '@type': 'SoftwareApplication',
    '@id': `${origin}/#app`,
    name: SITE_NAME,
    url: url('/'),
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web browser',
    description: PAGES['/'].description,
    softwareVersion: APP_RELEASE,
    featureList: [
      'Print-ready PDF export with bleed and crop marks',
      'PNG, SVG, vCard, and QR code export',
      `${templates.length} business card templates`,
      'Custom QR code styles',
      'Digital business cards with field-level privacy controls',
      'Hosted cards with short revocable links',
      'Batch PDF from a CSV roster'
    ],
    offers: PLAN_ORDER.map((tier) => ({
      '@type': 'Offer',
      name: PLANS[tier].name,
      price: (PLANS[tier].limits.price_cents / 100).toFixed(2),
      priceCurrency: 'USD',
      description: PLANS[tier].tagline,
      url: url('/pricing')
    }))
  };
  const graph: Record<string, unknown>[] = [organization, website, app];
  const meta = PAGES[path];
  const crumbs: [string, string][] = [['Home', '/']];

  if (path === '/pricing') {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: PRICING_FAQ.map(([name, text]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text } }))
    });
  }
  if (path === '/templates') {
    graph.push({
      '@type': 'ItemList',
      name: 'Business card templates',
      itemListElement: templates.map((template, index) => ({ '@type': 'ListItem', position: index + 1, name: `${template.name} business card template`, description: template.notes, url: `${url('/new')}?template=${template.id}` }))
    });
  }
  if (path === '/blog') {
    graph.push({
      '@type': 'Blog',
      name: `${SITE_NAME} guides`,
      url: url('/blog'),
      publisher: { '@id': organization['@id'] },
      blogPost: getPosts().map((post) => ({ '@type': 'BlogPosting', headline: post.title, url: url(`/blog/${post.slug}`), datePublished: post.date }))
    });
  }
  if (path.startsWith('/blog/')) {
    const post = getPosts().find((item) => `/blog/${item.slug}` === path);
    if (post) {
      graph.push({
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.description,
        datePublished: post.date,
        dateModified: post.updated,
        keywords: [post.keyword, ...post.tags].filter(Boolean).join(', '),
        wordCount: post.markdown.split(/\s+/).length,
        author: { '@id': organization['@id'] },
        publisher: { '@id': organization['@id'] },
        mainEntityOfPage: url(path),
        image: `${origin}/og.png`
      });
      crumbs.push(['Guides', '/blog'], [post.title, path]);
    }
  } else if (path !== '/' && meta) {
    crumbs.push([meta.heading, path]);
  }
  if (crumbs.length > 1) {
    graph.push({ '@type': 'BreadcrumbList', itemListElement: crumbs.map(([name, p], index) => ({ '@type': 'ListItem', position: index + 1, name, item: url(p) })) });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

/** Plain-language template list for llms.txt. */
export function templateSummaries() {
  return templates.map((template) => ({ id: template.id, name: template.name, category: template.category, notes: template.notes }));
}
