// Auto-Cleanup: dieser Service Worker entfernt sich selbst
// und loescht alle Caches der alten App-Version
self.addEventListener('install', function(e) {
  self.skipWaiting();
});
self.addEventListener('activate', function(e) {
  e.waitUntil(
    Promise.all([
      caches.keys().then(function(names) {
        return Promise.all(names.map(function(n) { return caches.delete(n); }));
      }),
      self.registration.unregister().then(function() {
        return self.clients.matchAll();
      }).then(function(clients) {
        clients.forEach(function(c) { c.navigate(c.url); });
      })
    ])
  );
});
self.addEventListener('fetch', function(e) {
  // Network-only: keine Caches mehr, immer frisch laden
  e.respondWith(fetch(e.request));
});