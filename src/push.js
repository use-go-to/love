// src/push.js
// Gère l'enregistrement du service worker et l'abonnement push VAPID

import { supabase } from './supabase'

// ── Clé publique VAPID ──
// Génère la tienne avec : npx web-push generate-vapid-keys
// puis mets la clé publique ici et la privée dans les secrets Supabase
export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

// Convertit la clé VAPID base64 en Uint8Array (requis par l'API)
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

// ── Enregistre le SW et souscrit aux push ──
export async function registerPush(userName) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push non supporté sur ce navigateur')
    return false
  }

  try {
    // 1. Enregistre le service worker
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    await navigator.serviceWorker.ready

    // 2. Demande la permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.log('Permission push refusée')
      return false
    }

    // 3. Crée la souscription VAPID
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    })

    // 4. Sauvegarde en base
    const sub = subscription.toJSON()
    await supabase.from('push_subscriptions').upsert({
      user_name: userName,
      endpoint:  sub.endpoint,
      p256dh:    sub.keys.p256dh,
      auth:      sub.keys.auth,
      updated_at: new Date().toISOString()
    }, { onConflict: 'endpoint' })

    console.log('✅ Push enregistré pour', userName)
    return true
  } catch (err) {
    console.error('Erreur push:', err)
    return false
  }
}

// ── Supprime la souscription (logout) ──
export async function unregisterPush() {
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js')
    if (!reg) return
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return
    await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
    await sub.unsubscribe()
  } catch (err) {
    console.error('Erreur unregister push:', err)
  }
}
