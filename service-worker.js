const CACHE_NAME = 'kiosk-architect-v2';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  '/icon.svg',
  '/manifest.json',
  '/screenshot_desktop.svg',
  '/screenshot_mobile.svg'
];

// Install: Cache core files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Stale-while-revalidate for most, Network first for API/Data
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Handle CDN/External requests (Cache First)
  if (url.hostname.includes('cdn') || url.hostname.includes('googleapis') || url.hostname.includes('gstatic')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((networkResponse) => {
          // Check for valid response
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'cors') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        }).catch(() => {
           // Fallback for images if offline
           return new Response('/* Offline Asset */', { status: 404 });
        });
      })
    );
    return;
  }

  // 2. Local Assets (Stale-While-Revalidate)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Update cache with new version
        if (networkResponse && networkResponse.status === 200) {
           const responseToCache = networkResponse.clone();
           caches.open(CACHE_NAME).then((cache) => {
             cache.put(event.request, responseToCache);
           });
        }
        return networkResponse;
      }).catch(err => {
         // Network failed, if we don't have cached response, we are in trouble.
         // But for Stale-While-Revalidate, we return cachedResponse below if it exists.
         console.log('Network fetch failed, falling back to cache if available.');
      });

      return cachedResponse || fetchPromise;
    })
  );
});