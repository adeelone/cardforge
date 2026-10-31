// Post-build: prerender public pages and generate discovery files.
//
// `vite build --ssr src/prerender.tsx` produces dist-ssr/prerender.js; this
// script renders every public route through it so crawlers and AI assistants
// read real content, then writes sitemap.xml, robots.txt, rss.xml, llms.txt,
// llms-full.txt, and per-route HTML with correct metadata.
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const dist = new URL('../dist/', import.meta.url);
const defaultSiteOrigin = 'https://adeelone.github.io/cardforge';
// Mirrors vite.config.ts: Vercel builds default to the production domain.
const vercelOrigin = process.env.VERCEL === '1' && process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '';
const siteOrigin = (process.env.VITE_SITE_ORIGIN || vercelOrigin || defaultSiteOrigin).replace(/\/$/, '');
const base = process.env.GITHUB_PAGES === 'true' ? '/cardforge' : '';

const seoConfig = JSON.parse(await readFile(new URL('../seo.config.json', import.meta.url), 'utf8'));
const verification = {
  google: process.env.GOOGLE_SITE_VERIFICATION || seoConfig.googleSiteVerification || '',
  bing: process.env.BING_SITE_VERIFICATION || seoConfig.bingSiteVerification || ''
};

const ssr = await import(new URL('../dist-ssr/prerender.js', import.meta.url).href);
const { PAGES, PLANS, PLAN_ORDER, SITE_NAME, APP_RELEASE } = ssr;
const posts = ssr.getPosts();
const url = (path) => `${siteOrigin}${path === '/' ? '/' : path}`;

const escapeHtml = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const escapeXml = escapeHtml;

function replaceMeta(html, key, value) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(<meta\\s+(?:name|property)="${escaped}"\\s+content=")[^"]*("\\s*/?>)`, 'i');
  if (!pattern.test(html)) throw new Error(`index.html is missing <meta ${key}>`);
  return html.replace(pattern, `$1${escapeHtml(value)}$2`);
}

function staticHeader() {
  // Mirrors the app shell's primary navigation (src/app/shell.tsx).
  const links = [['/new', 'Editor'], ['/templates', 'Templates'], ['/library', 'My cards'], ['/organizations', 'For teams'], ['/blog', 'Guides'], ['/pricing', 'Pricing']];
  return (
    `<header class="topbar"><a class="brand" href="${base}/"><span class="brand-mark" aria-hidden="true">CF</span><span class="brand-name">${SITE_NAME}</span></a>` +
    `<nav aria-label="Primary navigation" class="static-nav">${links.map(([href, label]) => `<a class="nav-link" href="${base}${href}">${label}</a>`).join('')}</nav>` +
    `<div class="topbar-actions"><a class="primary-button compact" href="${base}/new">New card</a></div></header>`
  );
}

function fallbackBody(heading, description) {
  return `<main class="source-fallback"><p class="source-fallback-kicker">Free business card maker</p><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(description)}</p><nav aria-label="Get started"><a href="${base}/new">Open the editor</a><a href="${base}/templates">Browse templates</a><a href="${base}/blog">Read the guides</a></nav></main>`;
}

let template = await readFile(new URL('index.html', dist), 'utf8');
if (/sourceMappingURL=/.test(template)) throw new Error('Production HTML unexpectedly references a source map.');

// Shared head additions: site name, image details, and optional verification.
const headExtras = [
  `<meta property="og:site_name" content="${SITE_NAME}" />`,
  '<meta property="og:image:width" content="1200" />',
  '<meta property="og:image:height" content="630" />',
  '<meta name="twitter:image:alt" content="CardForge business card editor preview" />',
  `<link rel="alternate" type="application/rss+xml" title="${SITE_NAME} guides" href="${siteOrigin}/rss.xml" />`,
  verification.google ? `<meta name="google-site-verification" content="${escapeHtml(verification.google)}" />` : '',
  verification.bing ? `<meta name="msvalidate.01" content="${escapeHtml(verification.bing)}" />` : ''
].filter(Boolean);
template = template.replace('</head>', `    ${headExtras.join('\n    ')}\n  </head>`);
template = replaceMeta(template, 'og:image', `${siteOrigin}/og.png`);
template = replaceMeta(template, 'twitter:image', `${siteOrigin}/og.png`);

function renderDocument(path, meta, body, { type = 'website', published, modified } = {}) {
  const canonical = url(path);
  let html = template
    .replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(meta.title)}</title>`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<script type="application\/ld\+json">.*?<\/script>/s, `<script type="application/ld+json">${JSON.stringify(ssr.structuredData(path, siteOrigin)).replace(/</g, '\\u003c')}</script>`)
    .replace(/<div id="root">.*?<\/div>\s*(?=<script|<\/body>)/s, `<div id="root">${body}</div>\n    `);
  html = replaceMeta(html, 'description', meta.description);
  html = replaceMeta(html, 'robots', meta.index === false ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
  html = replaceMeta(html, 'og:type', type);
  html = replaceMeta(html, 'og:title', meta.title);
  html = replaceMeta(html, 'og:description', meta.description);
  html = replaceMeta(html, 'og:url', canonical);
  html = replaceMeta(html, 'twitter:title', meta.title);
  html = replaceMeta(html, 'twitter:description', meta.description);
  if (published) {
    html = html.replace('</head>', `  <meta property="article:published_time" content="${published}" />\n    <meta property="article:modified_time" content="${modified ?? published}" />\n  </head>`);
  }
  return html;
}

async function writePage(path, html) {
  const directory = path === '/' ? dist : new URL(`.${path}/`, dist);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL('index.html', directory), html);
}

// 1. Prerendered public pages and blog posts.
for (const path of ssr.prerenderPaths()) {
  const post = path.startsWith('/blog/') ? posts.find((item) => `/blog/${item.slug}` === path) : null;
  const meta = post ? { title: `${post.title} | ${SITE_NAME}`, description: post.description, heading: post.title } : PAGES[path];
  const body = staticHeader() + ssr.renderPage(path, base);
  await writePage(path, renderDocument(path, meta, body, post ? { type: 'article', published: post.date, modified: post.updated } : {}));
}

// 2. App-only routes get a light shell with their own noindex metadata.
for (const [path, meta] of Object.entries(PAGES)) {
  if (meta.index !== false) continue;
  await writePage(path, renderDocument(path, meta, fallbackBody(meta.heading, meta.description)));
}

// 3. Neutral SPA shell for dynamic routes (/c/:slug, /design/:id, /checkout/:plan,
// and posts scheduled after the last build). Host rewrites point here instead
// of the prerendered home page so those routes never flash landing content.
await writeFile(
  new URL('app.html', dist),
  renderDocument('/', { title: `${SITE_NAME}`, description: PAGES['/'].description, index: false }, '<main class="route-pending" aria-busy="true"></main>')
);

// 4. sitemap.xml — indexable pages plus posts (with real last-modified dates).
const sitemapEntries = [
  ...Object.entries(PAGES)
    .filter(([, meta]) => meta.index !== false && meta.sitemap)
    .map(([path, meta]) => ({ loc: url(path), changefreq: meta.sitemap.changefreq, priority: meta.sitemap.priority })),
  ...posts.map((post) => ({ loc: url(`/blog/${post.slug}`), lastmod: post.updated, changefreq: 'monthly', priority: 0.7 }))
];
await writeFile(
  new URL('sitemap.xml', dist),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries
    .map((entry) => `  <url><loc>${escapeXml(entry.loc)}</loc>${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}<changefreq>${entry.changefreq}</changefreq><priority>${entry.priority.toFixed(1)}</priority></url>`)
    .join('\n')}\n</urlset>\n`
);

// 5. robots.txt — every crawler, including AI assistants, may read public pages.
const privatePaths = ['/account', '/checkout/', '/settings'];
const aiAgents = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User',
  'Google-Extended', 'Applebot-Extended', 'Meta-ExternalAgent', 'Amazonbot', 'DuckAssistBot', 'MistralAI-User', 'CCBot'
];
const rules = ['Allow: /', ...privatePaths.map((path) => `Disallow: ${base}${path}`)].join('\n');
await writeFile(
  new URL('robots.txt', dist),
  `# ${SITE_NAME}: search engines and AI assistants are welcome to read and cite public pages.\n` +
    `# Hosted cards (/c/*) and editor pages send a noindex header to protect people's contact details.\n\n` +
    `User-agent: *\n${rules}\n\n` +
    `# AI search and assistant crawlers: explicitly allowed.\n${aiAgents.map((agent) => `User-agent: ${agent}`).join('\n')}\n${rules}\n\n` +
    `Sitemap: ${siteOrigin}/sitemap.xml\n`
);

// 6. rss.xml — the blog feed.
await writeFile(
  new URL('rss.xml', dist),
  `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n` +
    `  <title>${SITE_NAME} guides</title>\n  <link>${url('/blog')}</link>\n  <description>${escapeXml(PAGES['/blog'].description)}</description>\n  <language>en</language>\n` +
    `  <atom:link href="${siteOrigin}/rss.xml" rel="self" type="application/rss+xml" />\n` +
    posts
      .map((post) => `  <item>\n    <title>${escapeXml(post.title)}</title>\n    <link>${url(`/blog/${post.slug}`)}</link>\n    <guid isPermaLink="true">${url(`/blog/${post.slug}`)}</guid>\n    <pubDate>${new Date(`${post.date}T12:00:00Z`).toUTCString()}</pubDate>\n    <description>${escapeXml(post.description)}</description>\n  </item>`)
      .join('\n') +
    `\n</channel>\n</rss>\n`
);

// 7. llms.txt (index) and llms-full.txt (full text) for AI assistants.
const priceLine = PLAN_ORDER.map((tier) => `${PLANS[tier].name} ${tier === 'free' ? '$0' : `$${PLANS[tier].limits.price_cents / 100}/month`}`).join(', ');
const indexable = Object.entries(PAGES).filter(([, meta]) => meta.index !== false);
const llms = `# ${SITE_NAME}

> ${SITE_NAME} is a free business card maker for print and digital cards. Design in the browser with no sign-up, export a print-ready PDF with bleed and crop marks, add a custom QR code, and share a digital business card. Optional CardForge Cloud accounts add cross-device sync, hosted cards at short revocable links, and privacy-respecting view counts.

Key facts:
- Free forever for local design and every export (PDF with bleed, PNG, SVG, vCard, QR SVG, JSON).
- Plans: ${priceLine}. Paid plans add more synced cards and live hosted cards, custom links, view analytics, and badge removal.
- ${ssr.templateSummaries().length} templates; card sizes for the US (3.5 × 2 in), EU/UK (85 × 55 mm), Japan (91 × 55 mm), square, and mini.
- Privacy: designs stay in the browser unless the user syncs or publishes them; hosted-card analytics store daily counts only.
- Current version: ${APP_RELEASE}.

## Pages

${indexable.map(([path, meta]) => `- [${meta.heading}](${url(path)}): ${meta.description}`).join('\n')}

## Guides

${posts.map((post) => `- [${post.title}](${url(`/blog/${post.slug}`)}): ${post.description}`).join('\n')}

## Optional

- [Full text of guides and key pages](${siteOrigin}/llms-full.txt)
- [Source code](https://github.com/adeelone/cardforge)
`;
await writeFile(new URL('llms.txt', dist), llms);

const templatesText = ssr.templateSummaries().map((item) => `- ${item.name} (${item.category}): ${item.notes}`).join('\n');
const plansText = PLAN_ORDER.map((tier) => {
  const plan = PLANS[tier];
  return `### ${plan.name} — ${tier === 'free' ? '$0 forever' : `$${plan.limits.price_cents / 100} per month`}\n\n${plan.tagline}\n\n${plan.highlights.map((line) => `- ${line}`).join('\n')}`;
}).join('\n\n');
const llmsFull = `# ${SITE_NAME} — full text

${llms.split('\n## Pages')[0].split('\n').slice(2).join('\n').trim()}

## Plans

${plansText}

## Templates

${templatesText}

${posts.map((post) => `## ${post.title}\n\nURL: ${url(`/blog/${post.slug}`)}\nPublished: ${post.date}\n\n${post.markdown}`).join('\n\n---\n\n')}
`;
await writeFile(new URL('llms-full.txt', dist), llmsFull);

// 8. Remaining static files that reference the canonical origin.
for (const path of ['.well-known/security.txt']) {
  const target = new URL(path, dist);
  const content = await readFile(target, 'utf8');
  await writeFile(target, content.replaceAll(defaultSiteOrigin, siteOrigin));
}

await writeFile(new URL('.nojekyll', dist), '');
console.log(`postbuild: ${ssr.prerenderPaths().length} prerendered pages, ${posts.length} posts, origin ${siteOrigin}${verification.google ? ', Google verification' : ''}${verification.bing ? ', Bing verification' : ''}`);
