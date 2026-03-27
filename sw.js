const CACHE_NAME = 'masterai-v3.0-iOS';

const STATIC_ASSETS = [
  './',
  'index.html',
  'manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
  console.log('🚀 Master AI SW v3.0-iOS yüklendi');
});

self.addEventListener('fetch', event => {
  const url = event.request.url;
  if (!url.startsWith(self.location.origin)) {
    event.respondWith(
      fetch(event.request).catch(() => new Response('Network error', { status: 503 }))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return networkResponse;
      });
    })
  );
});

self.addEventListener('sync', event => {
  if (event.tag === 'masterai-refresh') {
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage({ type: 'REFRESH' }));
      })
    );
  }
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'PING') {
    event.source.postMessage({ type: 'PONG', timestamp: Date.now() });
  }
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))),
      self.clients.claim()
    ])
  );
  console.log('✅ Master AI SW v3.0-iOS aktif');
});

// Web Push desteği (iOS + Android native bildirim)
self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.body || 'Yeni sinyal',
    icon: 'https://via.placeholder.com/192/ffd700/0a0e1a?text=⚡MA',
    badge: 'https://via.placeholder.com/96/ffd700/0a0e1a?text=MA',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' }
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
