const CACHE_NAME = 'gestion-de-vente-v1';
const FILES = ['/', '/index.html', '/produits.html', '/styles.css', '/app.js', '/manifest.json'];

self.addEventListener('install', evt => {
  evt.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('activate', evt => { evt.waitUntil(clients.claim()); });
self.addEventListener('fetch', evt => {
  evt.respondWith(caches.match(evt.request).then(resp => resp || fetch(evt.request).then(r=>{ caches.open(CACHE_NAME).then(c=>{ try{ c.put(evt.request, r.clone()); }catch(e){} }); return r; })).catch(()=>caches.match('/index.html')) );
});
