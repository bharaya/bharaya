// Lets the phone install the page as an app.
// Files come from the network first, so a new upload to GitHub shows on the
// next open; the copy kept here is only for opening with no signal. Calls to
// the ledger go to Google, another site, and are never touched or kept.

const CACHE = 'balai-haraya-v2';
const FILES = [
  './', 'index.html', 'manifest.webmanifest',
  'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'
];

self.addEventListener('install', event => {
  // One by one, so a missing icon cannot stop the app installing.
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.all(FILES.map(file => cache.add(file).catch(() => {}))))
      .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  // no-cache: always ask GitHub, which answers "unchanged" in a few bytes when
  // nothing is new. Without it the browser may reuse its own copy for up to
  // 10 minutes after an upload. By URL, since a page request cannot be copied
  // with options of its own.
  event.respondWith(
    fetch(request.url, { cache: 'no-cache', credentials: 'same-origin' })
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then(hit => hit || caches.match('./'))));
});
