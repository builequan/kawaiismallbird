'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only register service worker in production and if supported
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('[SW] Service Worker registered:', registration.scope)

          // Check for updates periodically
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available, could show update notification
                  console.log('[SW] New content available, please refresh')
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('[SW] Service Worker registration failed:', error)
        })

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('[SW] Message from service worker:', event.data)
      })
    }
  }, [])

  return null
}
