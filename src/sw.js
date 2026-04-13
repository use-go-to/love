import { precacheAndRoute } from 'workbox-precaching'

precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

self.addEventListener('push', e => {
  let payload = { title: 'À Deux', body: 'Nouveau message', url: '/love/' }
  if (e.data) {
    try { payload = { ...payload, ...e.data.json() } }
    catch (_) { payload.body = e.data.text() || payload.body }
  }

  const options = {
    body:     payload.body,
    icon:     '/love/icon-192.png',
    badge:    '/love/icon-192.png',
    tag:      'adeux-' + Date.now(),
    renotify: false,
    vibrate:  [100, 50, 100],
    data:     { url: payload.url },
  }

  e.waitUntil(
    self.registration.showNotification(payload.title, options)
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  const target = e.notification.data?.url || '/love/'
  e.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => {
        const existing = clients.find(c => c.url.startsWith(self.location.origin + '/love/'))
        if (existing) return existing.focus()
        return self.clients.openWindow(target)
      })
  )
})
