const CACHE_NAME = "konfeti-v10";

const APP_SHELL = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) {
            return key !== CACHE_NAME;
          })
          .map(function (key) {
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  const url = new URL(event.request.url);

  // Sunucu, Firebase ve başka sitelere giden istekler ile GET olmayan istekler hiç karışmadan ağa gider.
  if (event.request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // Sayfa açılışları ve kod/tasarım dosyaları: önce ağdan alınır ki güncellemeler hemen gelsin.
  // İnternet yoksa önbellekteki sürüm kullanılır. Kelime listesi nadiren değiştiği için önbellekten gelir.
  const isCodeFile = (url.pathname.endsWith(".js") || url.pathname.endsWith(".css")) && !url.pathname.endsWith("/words.js");

  if (event.request.mode === "navigate" || isCodeFile) {
    event.respondWith(
      fetch(event.request)
        .then(function (networkResponse) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, clone);
          });
          return networkResponse;
        })
        .catch(function () {
          return (event.request.mode === "navigate" ? caches.match("./index.html") : caches.match(event.request))
            .then(function (r) { return r || Response.error(); });
        })
    );
    return;
  }

  // Everything else (icons, manifest, etc.): cache-first, since these rarely change.
  event.respondWith(
    caches.match(event.request).then(function (cachedResponse) {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then(function (networkResponse) {
          if (networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, clone);
            });
          }
          return networkResponse;
        })
        .catch(function () {
          return Response.error();
        });
    })
  );
});
