// ── Italiano Trainer – Service Worker ──────────────────────────────────────
// Version hochzählen wenn du neue Dateien hochlädst → erzwingt Cache-Update
const CACHE_NAME = 'italiano-v1';

// Alle Dateien die offline verfügbar sein sollen
const FILES_TO_CACHE = [
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// ── INSTALL: Dateien in Cache speichern ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Dateien werden gecacht...');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// ── ACTIVATE: Alten Cache löschen ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Alter Cache gelöscht:', key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

// ── FETCH: Cache-First Strategie ──
// → Erst Cache prüfen, dann Netzwerk (funktioniert offline)
self.addEventListener('fetch', event => {
  // Nur GET-Anfragen cachen
  if (event.request.method !== 'GET') return;

  // Externe Bilder (Unsplash) nur aus Netzwerk laden, kein Cache-Fehler
  if (event.request.url.includes('unsplash.com') ||
      event.request.url.includes('fonts.googleapis.com') ||
      event.request.url.includes('fonts.gstatic.com')) {
    event.respondWith(
      fetch(event.request).catch(() => new Response('', { status: 408 }))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Erfolgreiche Antworten auch in Cache speichern
        if (response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      });
    }).catch(() => {
      // Fallback wenn offline und nicht im Cache
      return caches.match('/index.html');
    })
  );
});
