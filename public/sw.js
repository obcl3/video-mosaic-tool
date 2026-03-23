const CACHE_NAME = 'video-mosaic-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
]

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache')
      return cache.addAll(urlsToCache).catch((err) => {
        console.warn('Failed to cache some assets:', err)
      })
    })
  )
  self.skipWaiting()
})

// Activate service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - Cache first strategy with network fallback
self.addEventListener('fetch', (event) => {
  // Skip requests that we can't handle
  if (event.request.method !== 'GET') {
    return
  }

  // Handle requests
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if available
      if (response) {
        return response
      }

      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === 'error') {
            return response
          }

          // Clone the response
          const responseToCache = response.clone()

          // Cache cacheable content
          const url = event.request.url
          if (
            url.includes('cdn.jsdelivr.net') ||
            url.includes('fonts') ||
            url.includes('static')
          ) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache)
            })
          }

          return response
        })
        .catch((error) => {
          console.warn('Fetch failed:', error)
          // Return offline page if available
          return caches.match('/offline.html')
        })
    })
  )
})

// Background sync for future feature (if needed)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-videos') {
    event.waitUntil(
      // Sync logic here
      Promise.resolve()
    )
  }
})
