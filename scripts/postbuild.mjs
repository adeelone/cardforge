import { mkdir, readFile, writeFile } from 'node:fs/promises';

const dist = new URL('../dist/', import.meta.url);
const defaultSiteOrigin = 'https://adeelone.github.io/cardforge';
// Mirrors vite.config.ts: Vercel builds default to the production domain.
const vercelOrigin = process.env.VERCEL === '1' && process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '';
const siteOrigin = (process.env.VITE_SITE_ORIGIN || vercelOrigin || defaultSiteOrigin).replace(/\/$/, '');

const pages = [
  ['new', 'Business card editor | CardForge', 'Create a private, print-ready business card with freeform editing, real typography, customizable QR codes, and professional exports.', 'Business card editor', false],
  ['templates', 'Business card templates | CardForge', 'Browse professional business card templates for students, entrepreneurs, creative studios, local businesses, and growing teams.', 'Business card templates', true],
  ['library', 'My saved cards | CardForge', 'Manage business card designs saved privately in this browser.', 'My saved cards', false],
  ['settings', 'Settings | CardForge', 'Manage CardForge appearance, units, local data, backups, and privacy controls.', 'CardForge settings', false],
  ['trust', 'Security and trust | CardForge', 'Review CardForge security controls, private local storage model, sharing boundaries, and responsible deployment guidance.', 'Security and trust', true],
  ['organizations', 'Business cards for schools and teams | CardForge', 'Create a consistent, consent-aware business card system for schools, cohorts, studios, and professional teams.', 'Business cards for schools and teams', true],
  ['sharing', 'Private digital card sharing | CardForge', 'Learn how CardForge creates portable digital card links and lets you choose exactly what information to share.', 'Private digital card sharing', true],
  ['privacy', 'Privacy policy | CardForge', 'Read how CardForge stores designs locally, avoids tracking, handles sharing links, and protects your choices.', 'CardForge privacy policy', true],
  ['terms', 'Terms of use | CardForge', 'Read the terms for using the open-source CardForge business card studio and its hosted application.', 'CardForge terms of use', true],
  ['accessibility', 'Accessibility | CardForge', 'Review CardForge accessibility goals, editor support, known limitations, and feedback process.', 'CardForge accessibility', true],
  ['pricing', 'Pricing | CardForge', 'Design and print business cards free forever. Upgrade for synced cards, short revocable links, custom URLs, and privacy-respecting view analytics.', 'CardForge pricing', true],
  ['login', 'Sign in | CardForge', 'Sign in to CardForge to sync business cards across devices and publish hosted digital cards.', 'Sign in to CardForge', false],
  ['account', 'Your account | CardForge', 'Manage your CardForge plan, hosted cards, analytics, and billing history.', 'Your CardForge account', false],
  ['help', 'Help and browser support | CardForge', 'Get help with saved cards, exports, printing, QR scanning, browser support, and CardForge updates.', 'CardForge help', true]
];

function replaceMeta(html, key, value) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(
    new RegExp(`(<meta\\s+(?:name|property)="${escaped}"\\s+content=")[^"]*("\\s*/?>)`, 'i'),
    `$1${value}$2`
  );
}

let template = await readFile(new URL('index.html', dist), 'utf8');
template = template.replace(
  /<link rel="canonical" href="[^"]*"\s*\/>/,
  `<link rel="canonical" href="${siteOrigin}/" />`
);
template = replaceMeta(template, 'og:url', `${siteOrigin}/`);
template = replaceMeta(template, 'og:image', `${siteOrigin}/og.png`);
template = replaceMeta(template, 'twitter:image', `${siteOrigin}/og.png`);
await writeFile(new URL('index.html', dist), template);

for (const [path, title, description, heading, indexable] of pages) {
  const canonical = `${siteOrigin}/${path}`;
  let html = template
    .replace(/<title>.*?<\/title>/s, `<title>${title}</title>`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`)
    .replace('<h1>Professional business cards, made in your browser</h1>', `<h1>${heading}</h1>`)
    .replace('Design print-ready and digital cards with thoughtful templates, customizable QR codes, and private on-device editing.', description);

  html = replaceMeta(html, 'description', description);
  html = replaceMeta(html, 'robots', indexable ? 'index, follow' : 'noindex, nofollow');
  html = replaceMeta(html, 'og:title', title);
  html = replaceMeta(html, 'og:description', description);
  html = replaceMeta(html, 'og:url', canonical);
  html = replaceMeta(html, 'twitter:title', title);
  html = replaceMeta(html, 'twitter:description', description);

  const directory = new URL(`${path}/`, dist);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL('index.html', directory), html);
}

if (/sourceMappingURL=/.test(template)) {
  throw new Error('Production HTML unexpectedly references a source map.');
}

for (const path of ['sitemap.xml', 'robots.txt', 'llms.txt', '.well-known/security.txt']) {
  const target = new URL(path, dist);
  const content = await readFile(target, 'utf8');
  await writeFile(target, content.replaceAll(defaultSiteOrigin, siteOrigin));
}

await writeFile(new URL('.nojekyll', dist), '');
