/**
 * EduConnect GH Service Worker
 * - Pre-caches the app shell on install
 * - Cache-first for static assets (JS/CSS/images), populated at runtime
 *   since Vite's production bundle filenames are content-hashed
 * - Network-first for page navigations, falling back to the cached shell
 *   or a dedicated offline page
 * - Network-only for API calls (data must stay fresh; a friendly JSON
 *   error is returned if the device is offline)
 */

const SW_VERSION = 'v1';
const STATIC_CACHE = `educonnect-static-${SW_VERSION}`;
const RUNTIME_CACHE = `educonnect-runtime-${SW_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/favicon-32x32.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== STATIC_CACHE && name !== RUNTIME_CACHE)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

const isApiRequest = (url) => url.pathname.startsWith('/api/');

const isSameOrigin = (url) => url.origin === self.location.origin;

/** Network-first for HTML navigations, with offline fallback */
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const shell = await caches.match('/index.html');
    if (shell) return shell;
    return caches.match('/offline.html');
  }
}

/** Cache-first for static, same-origin assets */
async function handleAssetRequest(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    return caches.match('/offline.html');
  }
}

/** Network-only for API calls, with a graceful offline JSON response */
async function handleApiRequest(request) {
  try {
    return await fetch(request);
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        offline: true,
        message: "You're offline. This action needs an internet connection.",
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return; // let POST/PUT/DELETE pass straight through, uncached
  }

  const url = new URL(request.url);

  if (!isSameOrigin(url)) {
    return; // don't intervene on cross-origin requests (e.g. font CDNs)
  }

  if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  event.respondWith(handleAssetRequest(request));
});
