// Service Worker for Kawaii Small Bird PWA
const CACHE_VERSION = 'v1.0.0'
const STATIC_CACHE = `static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`
const IMAGE_CACHE = `images-${CACHE_VERSION}`

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/categories',
  '/offline',
  '/favicon.ico',
  '/favicon-navi.svg',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...', CACHE_VERSION)
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.error('[SW] Failed to cache static assets:', err)
      })
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...', CACHE_VERSION)
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== STATIC_CACHE &&
            cacheName !== DYNAMIC_CACHE &&
            cacheName !== IMAGE_CACHE
          ) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  return self.clients.claim()
})

// Fetch event - network first for HTML, cache first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip admin and API requests (always go to network)
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api')) {
    return
  }

  // Handle images - cache first with fallback
  if (request.destination === 'image' || url.pathname.startsWith('/media/')) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          return fetch(request).then((networkResponse) => {
            // Only cache successful responses
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone())
            }
            return networkResponse
          }).catch(() => {
            // Return placeholder for failed image requests
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="#f3f4f6" width="400" height="300"/><text x="50%" y="50%" text-anchor="middle" fill="#9ca3af">画像を読み込めません</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            )
          })
        })
      })
    )
    return
  }

  // Handle static assets (JS, CSS, fonts) - cache first
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          return fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone())
            }
            return networkResponse
          })
        })
      })
    )
    return
  }

  // Handle HTML pages - network first with cache fallback
  if (request.destination === 'document' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Clone and cache successful responses
          if (networkResponse.ok) {
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, networkResponse.clone())
            })
          }
          return networkResponse
        })
        .catch(() => {
          // Try to serve from cache if network fails
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }
            // Serve offline page as last resort
            return caches.match('/offline').then((offlinePage) => {
              return offlinePage || new Response(
                '<html><body><h1>オフラインです</h1><p>インターネット接続を確認してください。</p></body></html>',
                { headers: { 'Content-Type': 'text/html' } }
              )
            })
          })
        })
    )
    return
  }

  // Default: network first for everything else
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  )
})

// Background sync for offline actions (future enhancement)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)
  // Future: implement offline form submissions, etc.
})

// Push notifications (future enhancement)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event)
  // Future: implement push notifications for new posts
})
