const CACHE_NAME = "military-info-v6";
const urlsToCache = [
  '/',
  '/index.html',
  '/about.html',
  '/contact.html',
  '/manifest.json',
  
  // Images
  '/Harimau Medium Tank.jpg',
  '/Sukhoi Su-30.jpg',
  '/download.jpg',
  '/Leopard 2RI Revolution - Indonesian Army.jpg',
  
  // Icons
  '/imgmanifest/Android-drome-192x192.png',
  '/imgmanifest/android-drome-512x512.png'
];

// Install
self.addEventListener('install', (event) => {
  console.log('🛠 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('❌ Cache addAll error:', error);
      })
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activated!');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑 Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - SIMPLE VERSION YANG PASTI BEKERJA
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip chrome-extension requests
  if (event.request.url.startsWith('chrome-extension://')) return;
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Jika ada di cache, return cached version
        if (response) {
          return response;
        }
        
        // Jika tidak ada di cache, fetch dari network
        return fetch(event.request)
          .then((networkResponse) => {
            // Jika response valid, cache dan return
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          })
          .catch(() => {
            // FALLBACK OFFLINE - PASTI BEKERJA
            console.log('🌐 Offline - Serving fallback');
            
            // Untuk halaman HTML, return index.html
            if (event.request.destination === 'document' || 
                event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
            
            // Untuk images, return default icon
            if (event.request.destination === 'image') {
              return caches.match('/imgmanifest/android-drome-512x512.png');
            }
            
            // Default fallback
            return new Response('🔌 You are offline. Please check your internet connection.', {
              status: 503,
              statusText: 'Offline',
              headers: new Headers({
                'Content-Type': 'text/plain; charset=utf-8'
              })
            });
          });
      })
  );
});
