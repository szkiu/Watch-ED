self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open("static").then((cache) => {
      return cache.addAll([
        "./",
        "./assets/css/index.css",
        "./assets/css/normalize.css",
        "./assets/js/index.js",
        "./assets/json/watches.json",
        "./assets/images/maskable_icon_x192.png",
        "./assets/images/home.png",
        "./assets/images/story.png",
      ]);
    })
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  )
});
