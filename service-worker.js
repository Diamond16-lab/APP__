self.addEventListener("install", function (event) {
  console.log("Service Worker instalado");
});

self.addEventListener("fetch", function (event) {
  // Estrategia simple: red primero
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
