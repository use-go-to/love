// sw.js — À Deux Service Worker
// Place ce fichier dans /public/sw.js

const CACHE = 'adeux-v2'

// ── Installation / Activation ──────────────────────────────
self.addEventListener('install',  () => self.skipWaiting())
self.addEventListener('activate', e  => e.waitUntil(self.clients.claim()))

// ── Push reçu ──────────────────────────────────────────────
// iOS exige que showNotification() soit appelé SYNCHRONEMENT
// dans le même microtask que e.waitUntil() — ne pas await avant.
self.addEventListener('push', e => {
  let payload = { title: 'À Deux', body: 'Nouveau message', url: '/love/' }

  if (e.data) {
    try       { payload = { ...payload, ...e.data.json() } }
    catch (_) { payload.body = e.data.text() || payload.body }
  }

  const options = {
    body:     payload.body,
    icon:     '/love/icon-192.png',
    badge:    '/love/icon-192.png',
    tag:      'adeux-message',
    renotify: true,
    // vibrate ignoré sur iOS mais utile Android
    vibrate:  [100, 50, 100],
    data:     { url: payload.url },
  }

  // e.waitUntil DOIT recevoir la Promise de showNotification directement
  e.waitUntil(
    self.registration.showNotification(payload.title, options)
  )
})

// ── Clic notif → focus ou ouvre l'app ──────────────────────
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
