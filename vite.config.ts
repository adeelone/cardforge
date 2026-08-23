import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8')) as { version: string };

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/cardforge/' : '/',
  plugins: [react()],
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
