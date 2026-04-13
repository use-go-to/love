// sw.js — À Deux Service Worker
// Place ce fichier dans /public/sw.js

const CACHE = 'adeux-v1'

// ── Installation ──
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

// ── Push reçu (hors app) ──
self.addEventListener('push', e => {
  let payload = { title: 'À Deux', body: 'Nouveau message' }
  if (e.data) {
    try { payload = e.data.json() }
    catch { payload = { title: 'À Deux', body: e.data.text() || 'Nouveau message' } }
  }

  const options = {
    body:     payload.body || 'Nouveau message',
    icon:     '/love/icon-192.png',
    badge:    '/love/icon-192.png',
    tag:      'adeux-message',
    renotify: true,
    vibrate:  [100, 50, 100],
    data:     { url: payload.url || '/love/' },
    actions:  []
  }

  e.waitUntil(
    self.registration.showNotification(payload.title || 'À Deux', options)
  )
})

// ── Clic sur la notif → ouvre / focus l'app ──
self.addEventListener('notificationclick', e => {
  e.notification.close()
  const target = e.notification.data?.url || '/love/'
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url.includes(self.location.origin))
      if (existing) return existing.focus()
      return self.clients.openWindow(target)
    })
  )
})
