import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
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

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/cardforge/' : '/',
  plugins: [react()],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
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
});
