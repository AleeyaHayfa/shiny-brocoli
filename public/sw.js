const CACHE_NAME = 'shadow-leveling-v2';
const ASSETS = [
  './',
  'index.html',
  'manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(() => {
        // Safe check for development assets that might fail to cache during local dev
        console.log('Some non-critical dev assets skipped during caching.');
      });
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (e) => {
  const isHtml = e.request.mode === 'navigate' || 
                 (e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html'));

  if (isHtml) {
    // Network-First strategy: Attempt network load first to fetch latest bundles.
    // Fall back to cached index.html only if network is offline.
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            try {
              caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
            } catch (err) {
              console.warn('Cache write failed:', err);
            }
          }
          return response;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Cache-First strategy for static items (images, PWA manifest, font files etc.)
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(e.request).then((response) => {
          // Dynamically cache successfully loaded assets (like fonts, local SVGs)
          const isSuccessful = response.status === 200;
          const isCacheable = e.request.url.includes('/assets/') || 
                              e.request.url.includes('.woff') || 
                              e.request.url.includes('manifest.json');
          
          if (isSuccessful && isCacheable) {
            const copy = response.clone();
            try {
              caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
            } catch (err) {
              console.warn('Dynamic cache write failed:', err);
            }
          }
          return response;
        });
      })
    );
  }
});
