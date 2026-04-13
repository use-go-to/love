import { precacheAndRoute } from 'workbox-precaching'

precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

// 🔥 FIX iOS
self.addEventListener('push', e => {
  let data = {}

  try {
    data = e.data?.json() || {}
  } catch {
    data = { body: e.data?.text() }
  }

  const title = data.title || 'À Deux'
  const body  = data.body  || 'Nouveau message'

  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/love/icon-192.png'
    })
  )
})

// clic notif
self.addEventListener('notificationclick', e => {
  e.notification.close()

  const url = '/love/'

  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => {
        const existing = clients.find(c => c.url.includes('/love/'))
        if (existing) return existing.focus()
        return self.clients.openWindow(url)
      })
  )
})
