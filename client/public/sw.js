/**
 * Twingle Service Worker
 * Handles background sync, push notifications, and offline caching
 */

const CACHE_NAME = 'twingle-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })()
  );
});

const TILE_HOSTS = ['tile.openstreetmap.org', 'server.arcgisonline.com'];

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  const isLocal = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

  let requestUrl;
  try {
    requestUrl = new URL(event.request.url);
  } catch (e) {
    return;
  }

  if (event.request.method !== 'GET') {
    return;
  }

  const isTile = TILE_HOSTS.some((host) => requestUrl.hostname.includes(host));

  // Cache map tiles for offline use (cache-first).
  if (isTile) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Only handle same-origin requests for the app shell.
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (isLocal) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request);
    }).catch(() => fetch(event.request))
  );
});

// Background sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-location') {
    event.waitUntil(console.log('Background sync: sync-location triggered'));
  }
});

// Push event
self.addEventListener('push', (event) => {
  const options = {
    body: 'You have a new connection request!',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    data: { dateOfArrival: Date.now(), primaryKey: 1 },
    actions: [
      { action: 'explore', title: 'View', icon: '/favicon.svg' },
      { action: 'close', title: 'Close', icon: '/favicon.svg' },
    ],
  };
  event.waitUntil(self.registration.showNotification('Twingle', options));
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === self.location.origin && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});