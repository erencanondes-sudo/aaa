const CACHE_NAME = "konfeti-v14";

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

/* Sayfa ve kod/tasarım dosyaları önce telefondaki kopyadan gelir (açılış internet beklemez);
   aynı anda yenisi indirilip saklanır, değişiklikler bir sonraki açılışta görünür.
   Resimler ve kelime listesi seyrek değiştiği için yalnızca telefonda yoksa indirilir. */
self.addEventListener("fetch", function (event) {
  const url = new URL(event.request.url);

  // Sunucu, Firebase ve başka sitelere giden istekler ile GET olmayan istekler hiç karışmadan ağa gider.
  if (event.request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  const sayfa = event.request.mode === "navigate";
  const anahtar = sayfa ? "./index.html" : event.request;
  const yenilenir = sayfa || ((url.pathname.endsWith(".js") || url.pathname.endsWith(".css")) && !url.pathname.endsWith("/words.js"));

  event.respondWith(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.match(anahtar).then(function (kopya) {
        function indir() {
          return fetch(event.request).then(function (yanit) {
            if (yanit.ok && !yanit.redirected) cache.put(anahtar, yanit.clone());
            return yanit;
          });
        }
        if (kopya) {
          if (yenilenir) event.waitUntil(indir().catch(function () {}));
          return kopya;
        }
        return indir().catch(function () {
          return Response.error();
        });
      });
    })
  );
});

/* Bildirimler (Firebase Cloud Messaging). Bildirime basılınca uygulama Oyunlarım'da açılır. */
self.addEventListener("push", function (event) {
  let veri = {};
  try { veri = event.data.json(); } catch (e) {}
  const n = veri.notification || {};
  event.waitUntil(
    self.registration.showNotification(n.title || "Konfeti", {
      body: n.body || "",
      icon: "./icon-192.png"
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (pencereler) {
      if (pencereler.length) {
        pencereler[0].postMessage("oyunlarim");
        return pencereler[0].focus();
      }
      return self.clients.openWindow("./?oyunlarim");
    })
  );
});
