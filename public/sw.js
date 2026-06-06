const CACHE_NAME = 'disaster-prep-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './src/main.tsx',
  './src/index.css',
  './src/App.tsx',
  './src/data.ts',
  './src/types.ts',
  './src/components/SuppliesInventory.tsx'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Pre-caching assets warning or offline mode:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Dynamic Offline Caching Handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip cross-origin POST requests or API routes
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // We should not cache actual live Gemini api endpoint
  if (url.pathname.includes('/api/gemini/')) {
    return;
  }

  // Network first with Cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (request.mode === 'navigate') {
            return caches.match('./index.html') || caches.match('./');
          }
          return new Response('Offline Content Unavailable', {
            status: 503,
            statusText: 'Service Unavailable (Offline)'
          });
        });
      })
  );
});
