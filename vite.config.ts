import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8')) as { version: string };

// Vercel builds (VERCEL=1) connect to the hosted CardForge Cloud project and
// use the production domain as the canonical origin. Both values are public by
// design — data access is governed by row-level security in the database — and
// any value set in the Vercel dashboard takes precedence. Every other build
// (local, CI, Docker, GitHub Pages) stays local-only unless configured.
if (process.env.VERCEL === '1') {
  process.env.VITE_SUPABASE_URL ??= 'https://qtlveonozjyahuywmiec.supabase.co';
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??= 'sb_publishable__zkpisB4UKeDqCGfVW_Zvg_-KBfNiwr';
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) process.env.VITE_SITE_ORIGIN ??= `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
}

/**
 * Make `vite preview` route like the production hosts (vercel.json and
 * friends): serve a prerendered <path>/index.html when one exists, the
 * neutral app.html for dynamic app routes, and the SPA fallback otherwise.
 * E2E tests run against preview, so this keeps them honest.
 */
function productionRouting(): Plugin {
  const dynamic = /^\/(c|design|checkout|blog)\/[^/]+\/?$/;
  return {
    name: 'cardforge-production-routing',
    configurePreviewServer(server) {
      const outDir = resolve(server.config.root, server.config.build.outDir);
      server.middlewares.use((req, _res, next) => {
        const [pathname, query = ''] = (req.url ?? '/').split('?');
        if (req.method !== 'GET' || pathname.includes('.') || pathname === '/') return next();
        const page = `${pathname.replace(/\/$/, '')}/index.html`;
        if (existsSync(`${outDir}${page}`)) req.url = page + (query ? `?${query}` : '');
        else if (dynamic.test(pathname)) req.url = `/app.html${query ? `?${query}` : ''}`;
        next();
      });
    }
  };
}

export default defineConfig(({ isSsrBuild }) => ({
  base: process.env.GITHUB_PAGES === 'true' ? '/cardforge/' : '/',
  plugins: [react(), productionRouting()],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // The prerender bundle is a single Node module; only split the browser build.
          if (isSsrBuild || !id.includes('node_modules')) return undefined;
          if (id.includes('pdf-lib')) return 'pdf-export';
          if (id.includes('@supabase')) return 'cloud-sdk';
          if (id.includes('qrcode')) return 'qr-code';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('react') || id.includes('scheduler')) return 'react-vendor';
          if (id.includes('zustand') || id.includes('idb-keyval') || id.includes('lz-string') || id.includes('colord')) {
            return 'editor-vendor';
          }
          return undefined;
        }
      }
    }
  },
  // Bundle dependencies into the prerender module so Node never has to resolve
  // CommonJS packages (lz-string, qrcode) through ESM interop.
  ssr: {
    noExternal: true
  },
  worker: {
    format: 'es'
  },
  define: {
    __APP_RELEASE__: JSON.stringify(pkg.version)
  },
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/exporters/**', 'src/editor/canvas/**', 'src/data/repo/**']
    }
  }
}));
