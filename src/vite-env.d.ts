/// <reference types="vite/client" />

/** Injected from package.json's `version` at build time — see vite.config.ts. */
declare const __APP_RELEASE__: string;

interface ImportMetaEnv {
  /** Optional public canonical origin for custom-domain builds. */
  readonly VITE_SITE_ORIGIN?: string;
  /** Optional CardForge Cloud (Supabase) project URL. Public. */
  readonly VITE_SUPABASE_URL?: string;
  /** Optional CardForge Cloud publishable (anon) key. Public by design. */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}
