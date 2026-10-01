const CACHE_NAME = 'mangaverse-v4';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/katalog.html',
  '/seri-detay.html',
  '/bolum-oku.html',
  '/profil.html',
  '/giris.html',
  '/css/reset.css',
  '/css/variables.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/cards.css',
  '/css/navbar.css',
  '/css/topbar.css',
  '/css/reader.css',
  '/css/animations.css',
  '/js/main.js',
  '/js/data.js',
  '/js/sidebar.js',
  '/js/search.js',
  '/js/auth.js',
  '/js/reader.js',
  '/js/animations.js',
  '/js/offline-db.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[SW] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim(); // Take control of all pages immediately
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Never cache API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => 
        new Response(JSON.stringify({ error: 'Offline' }), { 
          headers: { 'Content-Type': 'application/json' } 
        })
      )
    );
    return;
  }

  // NETWORK FIRST for everything — always get fresh files
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache a fresh copy for offline use
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => {
        // Offline fallback: serve from cache
        return caches.match(event.request);
      })
  );
});

// ============================================
// PUSH NOTIFICATIONS
// ============================================
self.addEventListener('push', (event) => {
  let data = { title: 'MangaVerse Bildirimi', body: 'Yeni bir gelişme var!', url: '/' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/images/icon-192.png',
    badge: '/images/icon-192.png',
    data: { url: data.url },
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If window is already open, focus it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
