import { absoluteUrl, type PageMeta } from './page-meta';

function setMeta(selector: string, attribute: string, value: string) {
  const element = document.head.querySelector<HTMLMetaElement>(selector);
  if (element) element.setAttribute(attribute, value);
}

/** Write title, description, robots, canonical, and social tags for the current view. */
export function applyPageMeta(page: Pick<PageMeta, 'title' | 'description' | 'index'>, canonicalPath: string) {
  const canonical = absoluteUrl(canonicalPath);
  document.title = page.title;
  setMeta('meta[name="description"]', 'content', page.description);
  setMeta('meta[property="og:title"]', 'content', page.title);
  setMeta('meta[property="og:description"]', 'content', page.description);
  setMeta('meta[property="og:url"]', 'content', canonical);
  setMeta('meta[name="twitter:title"]', 'content', page.title);
  setMeta('meta[name="twitter:description"]', 'content', page.description);
  setMeta('meta[name="robots"]', 'content', page.index === false ? 'noindex, nofollow' : 'index, follow');
  document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', canonical);
}
