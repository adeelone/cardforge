const CACHE_NAME = 'cardforge-v0.3.1';
const SHELL = ['.', 'manifest.webmanifest', 'icon.svg'].map((path) => new URL(path, self.registration.scope).toString());
const OFFLINE_URL = SHELL[0];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const responses = await Promise.all(SHELL.map((url) => fetch(new Request(url, { cache: 'reload' }))));
      await Promise.all(responses.map((response, index) => response.ok && cache.put(SHELL[index], response)));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('cardforge-') && key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(OFFLINE_URL, response.clone());
    }
    return response;
  } catch (error) {
    const cache = await caches.open(CACHE_NAME);
    const fallback = await cache.match(OFFLINE_URL);
    if (fallback) return fallback;
    throw error;
  }
}

async function cacheFirstAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  const url = new URL(request.url);
  const isVersionedAsset = url.pathname.includes('/assets/');
  const isShellAsset = url.pathname.endsWith('/manifest.webmanifest') || url.pathname.endsWith('/icon.svg');
  if (isVersionedAsset || isShellAsset) event.respondWith(cacheFirstAsset(request));
});
