/* Hvězdy Service Worker — manuální multi-strategy */
/* eslint-disable no-restricted-globals */

const APP_SHELL_CACHE = 'hvezdy-shell-v2';
const RUNTIME_API_CACHE = 'hvezdy-api-v1';
const RUNTIME_ASSETS_CACHE = 'hvezdy-assets-v1';

const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

const API_TIMEOUT_MS = 3000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((c) => c.addAll(APP_SHELL_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const allowed = new Set([APP_SHELL_CACHE, RUNTIME_API_CACHE, RUNTIME_ASSETS_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !allowed.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin) return;

  // Navigation requests → app shell fallback
  if (req.mode === 'navigate') {
    event.respondWith(handleNavigation(req));
    return;
  }

  // API
  if (url.pathname.startsWith('/api/')) {
    if (req.method === 'GET') {
      event.respondWith(handleApiGet(req));
    } else {
      event.respondWith(handleApiMutation(req));
    }
    return;
  }

  // Static assets
  if (req.method === 'GET') {
    event.respondWith(handleAsset(req));
  }
});

async function handleNavigation(req) {
  try {
    const network = await fetch(req);
    const cache = await caches.open(APP_SHELL_CACHE);
    cache.put('/index.html', network.clone()).catch(() => {});
    return network;
  } catch {
    const cached =
      (await caches.match('/index.html')) || (await caches.match('/'));
    if (cached) return cached;
    return new Response('Offline', { status: 503 });
  }
}

async function handleApiGet(req) {
  const cache = await caches.open(RUNTIME_API_CACHE);
  try {
    const network = await raceFetch(req, API_TIMEOUT_MS);
    if (network && network.ok) {
      cache.put(req, network.clone()).catch(() => {});
      return network;
    }
    if (network) return network;
    throw new Error('timeout');
  } catch {
    const cached = await cache.match(req);
    if (cached) {
      const headers = new Headers(cached.headers);
      headers.set('X-From-Cache', '1');
      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers,
      });
    }
    return new Response(
      JSON.stringify({ error: 'Offline a žádná cache' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json', 'X-Offline': '1' },
      },
    );
  }
}

async function handleApiMutation(req) {
  try {
    return await fetch(req);
  } catch {
    return new Response(
      JSON.stringify({ error: 'Mutace v offline není podporována' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json', 'X-Offline': '1' },
      },
    );
  }
}

async function handleAsset(req) {
  const cache = await caches.open(RUNTIME_ASSETS_CACHE);
  const cached = await cache.match(req);
  const networkPromise = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone()).catch(() => {});
      return res;
    })
    .catch(() => null);

  if (cached) {
    networkPromise.catch(() => {});
    return cached;
  }
  const network = await networkPromise;
  if (network) return network;
  return new Response('Offline', { status: 503 });
}

function raceFetch(req, timeoutMs) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), timeoutMs);
    fetch(req).then(
      (res) => {
        clearTimeout(t);
        resolve(res);
      },
      (err) => {
        clearTimeout(t);
        reject(err);
      },
    );
  });
}

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
