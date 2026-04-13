import { precacheAndRoute } from 'workbox-precaching'

precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

// 🔔 PUSH (ULTRA COMPATIBLE iOS)
self.addEventListener('push', e => {
  let data = {}

  try {
    data = e.data?.json() || {}
  } catch {
    data = { body: e.data?.text() }
  }

  const title = data.title || 'À Deux'
  const body  = data.body  || 'Nouveau message'
  const url   = data.url   || 'https://use-go-to.github.io/love/'

  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/love/icon-192.png',
      data: { url } // 🔥 IMPORTANT pour clic
    })
  )
})

// 👆 CLIC NOTIF (FIX PAGE BLEUE)
self.addEventListener('notificationclick', e => {
  e.notification.close()

  const target = e.notification.data?.url || 'https://TON-DOMAINE.com/love/'

  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => {
        for (const client of clients) {
          if (client.url.includes('/love/')) {
            return client.focus()
          }
        }
        return self.clients.openWindow(target)
      })
  )
})
