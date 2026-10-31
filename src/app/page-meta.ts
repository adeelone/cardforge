/**
 * Search metadata for every public route, shared by the client-side <Seo>
 * component and the build-time prerenderer (src/prerender.tsx), so titles in
 * the served HTML and in the running app never drift apart.
 *
 * Keyword strategy (see GROWTH.md): the home page owns "free business card
 * maker"; other pages target one supporting phrase each.
 */
export interface PageMeta {
  title: string;
  description: string;
  /** Visible heading used in the no-JavaScript fallback and breadcrumbs. */
  heading: string;
  index?: boolean;
  /** Include in sitemap.xml / llms.txt (indexable pages only). */
  sitemap?: { priority: number; changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly' };
}

export const SITE_NAME = 'CardForge';
export const PRIMARY_KEYWORD = 'free business card maker';

export const PAGES: Record<string, PageMeta> = {
  '/': {
    title: 'Free Business Card Maker — Print-Ready & Digital Cards | CardForge',
    description:
      'Free business card maker for print and digital cards. Pick a template, customize every detail, and export a print-ready PDF with bleed, a QR code, and a digital card — no sign-up needed.',
    heading: 'Free business card maker',
    sitemap: { priority: 1, changefreq: 'weekly' }
  },
  '/templates': {
    title: 'Free Business Card Templates — Print-Ready Designs | CardForge',
    description:
      'Browse free business card templates for consultants, creatives, students, shops, and teams. Every template exports a print-ready PDF and a scannable QR code.',
    heading: 'Free business card templates',
    sitemap: { priority: 0.9, changefreq: 'monthly' }
  },
  '/pricing': {
    title: 'Pricing — Free Forever, Pro from $9/month | CardForge',
    description:
      'Design and print business cards free forever. Upgrade for synced cards, short revocable links, custom URLs, and privacy-respecting view analytics.',
    heading: 'CardForge pricing',
    sitemap: { priority: 0.8, changefreq: 'monthly' }
  },
  '/blog': {
    title: 'Business Card Guides: Sizes, Printing & Digital Cards | CardForge',
    description:
      'Practical guides to business card sizes, bleed, printing, QR codes, and digital business cards — from the team behind the CardForge business card maker.',
    heading: 'Business card guides',
    sitemap: { priority: 0.8, changefreq: 'weekly' }
  },
  '/organizations': {
    title: 'Business Cards for Schools and Teams — Batch PDF from CSV | CardForge',
    description:
      'Create a consistent, consent-aware business card system for schools, cohorts, studios, and teams. Import a CSV roster and export one print-ready PDF.',
    heading: 'Business cards for schools and teams',
    sitemap: { priority: 0.7, changefreq: 'monthly' }
  },
  '/sharing': {
    title: 'Digital Business Card Sharing with Privacy Controls | CardForge',
    description: 'Share a digital business card by link or QR code and choose exactly which contact details travel with it.',
    heading: 'Private digital card sharing',
    sitemap: { priority: 0.6, changefreq: 'monthly' }
  },
  '/trust': {
    title: 'Security and Trust | CardForge',
    description: 'Review CardForge security controls, local-first storage model, sharing boundaries, and responsible deployment guidance.',
    heading: 'Security and trust',
    sitemap: { priority: 0.5, changefreq: 'monthly' }
  },
  '/help': {
    title: 'Help: Exports, Printing, QR Codes & Accounts | CardForge',
    description: 'Get help with saved cards, sync, hosted cards, exports, printing, QR scanning, browser support, and CardForge updates.',
    heading: 'CardForge help',
    sitemap: { priority: 0.5, changefreq: 'monthly' }
  },
  '/privacy': {
    title: 'Privacy Policy | CardForge',
    description: 'How CardForge stores designs locally, what CardForge Cloud keeps when you sign in, how hosted-card views are counted, and your choices.',
    heading: 'CardForge privacy policy',
    sitemap: { priority: 0.3, changefreq: 'yearly' }
  },
  '/terms': {
    title: 'Terms of Use | CardForge',
    description: 'The terms for using the CardForge business card maker, CardForge Cloud accounts, and plans.',
    heading: 'CardForge terms of use',
    sitemap: { priority: 0.3, changefreq: 'yearly' }
  },
  '/accessibility': {
    title: 'Accessibility | CardForge',
    description: 'CardForge accessibility goals, editor support, known limitations, and how to send feedback.',
    heading: 'CardForge accessibility',
    sitemap: { priority: 0.3, changefreq: 'yearly' }
  },
  '/new': {
    title: 'Business Card Editor | CardForge',
    description: 'Design a print-ready business card with freeform editing, real typography, customizable QR codes, and professional exports.',
    heading: 'Business card editor',
    index: false
  },
  '/library': { title: 'My Saved Cards | CardForge', description: 'Manage your saved business card designs.', heading: 'My saved cards', index: false },
  '/settings': { title: 'Settings | CardForge', description: 'Manage CardForge appearance, units, and local data.', heading: 'CardForge settings', index: false },
  '/login': {
    title: 'Sign In | CardForge',
    description: 'Sign in to CardForge to sync business cards across devices and publish hosted digital cards.',
    heading: 'Sign in to CardForge',
    index: false
  },
  '/account': {
    title: 'Your Account | CardForge',
    description: 'Manage your CardForge plan, hosted cards, analytics, and billing history.',
    heading: 'Your CardForge account',
    index: false
  }
};

export const NOT_FOUND_META: PageMeta = {
  title: 'Page not found | CardForge',
  description: 'The requested CardForge page could not be found.',
  heading: 'Page not found',
  index: false
};

/** Metadata for dynamic routes that have no entry in PAGES. */
export function dynamicMeta(pathname: string): PageMeta | undefined {
  if (pathname.startsWith('/design/')) return PAGES['/new'];
  if (pathname.startsWith('/checkout/')) return { title: 'Checkout | CardForge', description: 'Upgrade your CardForge plan.', heading: 'Checkout', index: false };
  if (pathname.startsWith('/c/')) return { title: 'Digital business card | CardForge', description: 'View a digital business card shared with CardForge.', heading: 'Digital business card', index: false };
  return undefined;
}

export const SITE_ORIGIN = (import.meta.env.VITE_SITE_ORIGIN || 'https://adeelone.github.io/cardforge').replace(/\/$/, '');

export function absoluteUrl(path: string) {
  return `${SITE_ORIGIN}${path === '/' ? '/' : path}`;
}
