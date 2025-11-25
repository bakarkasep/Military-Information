const CACHE_NAME = "military-info-v5";
const urlsToCache = [
  "./",
  "./index.html",
  "./about.html",
  "./contact.html",
  "./manifest.json",

  // Images
  "./Harimau Medium Tank.jpg",
  "./Sukhoi Su-30.jpg",
  "./download.jpg",
  "./Leopard 2RI Revolution - Indonesian Army.jpg",

  // Icons dari folder imgmanifest
  "./imgmanifest/Android-drome-192x192.png",
  "./imgmanifest/android-drome-512x512.png",
  "./imgmanifest/sshp.jpg",
  "./imgmanifest/sspc.jpg",
];

// Install Event
self.addEventListener("install", (event) => {
  console.log("🛠 Service Worker installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("📦 Caching app shell...");
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log("❌ Cache error:", error);
      })
  );
  self.skipWaiting(); // Langsung aktif tanpa menunggu
});

// Activate Event
self.addEventListener("activate", (event) => {
  console.log("🚀 Service Worker activated!");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("🗑 Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Langsung kontrol semua clients
});

// Fetch Event - Strategi Cache First, Fallback ke Network
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Jika ada di cache, return cached version
      if (cachedResponse) {
        console.log("📂 Serving from cache:", event.request.url);
        return cachedResponse;
      }

      // Jika tidak ada di cache, fetch dari network
      return fetch(event.request)
        .then((networkResponse) => {
          // Cek jika response valid
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== "basic"
          ) {
            return networkResponse;
          }

          // Clone response untuk cache
          const responseToCache = networkResponse.clone();

          // Tambahkan ke cache
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
            console.log("💾 Caching new resource:", event.request.url);
          });

          return networkResponse;
        })
        .catch((error) => {
          console.log("🌐 Network failed, serving fallback:", error);

          // Fallback untuk halaman HTML
          if (event.request.destination === "document") {
            return caches.match("./index.html");
          }

          // Fallback untuk images
          if (event.request.destination === "image") {
            return caches.match("./imgmanifest/android-drome-512x512.png");
          }

          return new Response("Offline - No connection", {
            status: 503,
            statusText: "Service Unavailable",
            headers: new Headers({
              "Content-Type": "text/plain",
            }),
          });
        });
    })
  );
});

// Background Sync (Optional - untuk form submission offline)
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    console.log("🔄 Background sync triggered");
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement background sync logic here
  console.log("🔄 Performing background sync...");
}
