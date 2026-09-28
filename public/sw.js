// MessCost PWA Service Worker — enables Android/Chrome "Install App" prompt
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  // Network-first strategy so live Firestore & Next.js pages stay fresh
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
