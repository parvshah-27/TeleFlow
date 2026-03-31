const CACHE_NAME = 'teleflow-v1';
const DATA_CACHE_NAME = 'teleflow-data-v1';

const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/src/main.jsx',
    '/src/index.css'
];

// Install event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
    // Cache strategy for API requests (Network First, then Cache)
    if (event.request.url.includes('/api/leads')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // If successful, clone and store in data cache
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(DATA_CACHE_NAME).then((cache) => {
                            cache.put(event.request.url, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // If network fails, try data cache
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Default strategy: Stale-While-Revalidate for assets
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                // Return cached but also fetch fresh in background
                fetch(event.request).then((networkResponse) => {
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse);
                    });
                });
                return cachedResponse;
            }
            return fetch(event.request);
        })
    );
});
