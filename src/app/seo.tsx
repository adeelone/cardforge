import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

type PageMeta = {
  title: string;
  description: string;
  index?: boolean;
};

const SITE_ORIGIN = (import.meta.env.VITE_SITE_ORIGIN || 'https://adeelone.github.io/cardforge').replace(/\/$/, '');

const pages: Record<string, PageMeta> = {
  '/': {
    title: 'CardForge — Print & digital business card studio',
    description: 'Design print-ready and digital business cards privately in your browser with thoughtful templates, customizable QR codes, and professional exports.'
  },
  '/new': {
    title: 'Business card editor | CardForge',
    description: 'Create a private, print-ready business card with freeform editing, real typography, customizable QR codes, and professional exports.',
    index: false
  },
  '/templates': {
    title: 'Business card templates | CardForge',
    description: 'Browse professional business card templates for students, entrepreneurs, creative studios, local businesses, and growing teams.'
  },
  '/library': {
    title: 'My saved cards | CardForge',
    description: 'Manage business card designs saved privately in this browser.',
    index: false
  },
  '/settings': {
    title: 'Settings | CardForge',
    description: 'Manage CardForge appearance, units, local data, backups, and privacy controls.',
    index: false
  },
  '/trust': {
    title: 'Security and trust | CardForge',
    description: 'Review CardForge security controls, private local storage model, sharing boundaries, and responsible deployment guidance.'
  },
  '/organizations': {
    title: 'Business cards for schools and teams | CardForge',
    description: 'Create a consistent, consent-aware business card system for schools, cohorts, studios, and professional teams.'
  },
  '/sharing': {
    title: 'Private digital card sharing | CardForge',
    description: 'Learn how CardForge creates portable digital card links and lets you choose exactly what information to share.'
  },
  '/privacy': {
    title: 'Privacy policy | CardForge',
    description: 'Read how CardForge stores designs locally, avoids tracking, handles sharing links, and protects your choices.'
  },
  '/terms': {
    title: 'Terms of use | CardForge',
    description: 'Read the terms for using the open-source CardForge business card studio and its hosted application.'
  },
  '/accessibility': {
    title: 'Accessibility | CardForge',
    description: 'Review CardForge accessibility goals, editor support, known limitations, and feedback process.'
  },
  '/pricing': {
    title: 'Pricing | CardForge',
    description: 'Design and print business cards free forever. Upgrade for synced cards, short revocable links, custom URLs, and privacy-respecting view analytics.'
  },
  '/login': {
    title: 'Sign in | CardForge',
    description: 'Sign in to CardForge to sync business cards across devices and publish hosted digital cards.',
    index: false
  },
  '/account': {
    title: 'Your account | CardForge',
    description: 'Manage your CardForge plan, hosted cards, analytics, and billing history.',
    index: false
  },
  '/help': {
    title: 'Help and browser support | CardForge',
    description: 'Get help with saved cards, exports, printing, QR scanning, browser support, and CardForge updates.'
  }
};

const fallback: PageMeta = {
  title: 'Page not found | CardForge',
  description: 'The requested CardForge page could not be found.',
  index: false
};

function setMeta(selector: string, attribute: string, value: string) {
  const element = document.head.querySelector<HTMLMetaElement>(selector);
  if (element) element.setAttribute(attribute, value);
}

export function Seo() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname.replace(/\/$/, '') || '/';
    const dynamic = pathname.startsWith('/design/')
      ? pages['/new']
      : pathname.startsWith('/checkout/')
        ? { title: 'Checkout | CardForge', description: 'Upgrade your CardForge plan.', index: false }
        : pathname.startsWith('/c/')
        ? { title: 'Digital business card | CardForge', description: 'View a digital business card shared with CardForge.', index: false }
        : undefined;
    const page = pages[pathname] ?? dynamic ?? fallback;
    const canonicalPath = pages[pathname] ? pathname : '/';
    const canonical = `${SITE_ORIGIN}${canonicalPath === '/' ? '/' : canonicalPath}`;

    document.title = page.title;
    setMeta('meta[name="description"]', 'content', page.description);
    setMeta('meta[property="og:title"]', 'content', page.title);
    setMeta('meta[property="og:description"]', 'content', page.description);
    setMeta('meta[property="og:url"]', 'content', canonical);
    setMeta('meta[name="twitter:title"]', 'content', page.title);
    setMeta('meta[name="twitter:description"]', 'content', page.description);
    setMeta('meta[name="robots"]', 'content', page.index === false ? 'noindex, nofollow' : 'index, follow');

    const canonicalLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    canonicalLink?.setAttribute('href', canonical);
  }, [location.pathname]);

  return null;
}
