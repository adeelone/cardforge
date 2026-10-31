import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { dynamicMeta, NOT_FOUND_META, PAGES } from './page-meta';
import { applyPageMeta } from './apply-meta';

/** Blog articles set their own metadata (see routes/blog.tsx). */
function ownsMeta(pathname: string) {
  return pathname.startsWith('/blog/');
}

export function Seo() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname.replace(/\/$/, '') || '/';
    if (ownsMeta(pathname)) return;
    const page = PAGES[pathname] ?? dynamicMeta(pathname) ?? NOT_FOUND_META;
    applyPageMeta(page, PAGES[pathname] ? pathname : '/');
  }, [location.pathname]);

  return null;
}
