// src/push.js
import { supabase } from './supabase'

export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export async function registerPush(userName) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push non supporté sur ce navigateur')
    return false
  }
  try {
    // 1. Enregistre le service worker (idempotent)
    const reg = await navigator.serviceWorker.register('/love/sw.js', { scope: '/love/' })
    await navigator.serviceWorker.ready

    // 2. Demande la permission (iOS : doit être dans un geste utilisateur)
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.log('Permission push refusée')
      return false
    }

    // 3. Vérifie si une souscription valide existe déjà
    let subscription = await reg.pushManager.getSubscription()

    // Si elle existe mais avec une ancienne clé VAPID → on la recrée
    if (subscription) {
      const existingKey = subscription.options?.applicationServerKey
      const newKey      = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      // Comparaison simple par longueur (les clés P-256 font toujours 65 bytes)
      if (existingKey && new Uint8Array(existingKey).length !== newKey.length) {
        await subscription.unsubscribe()
        subscription = null
      }
    }

    // 4. Crée la souscription si besoin
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })
    }

    // 5. Sauvegarde / met à jour en base
    const sub = subscription.toJSON()
    const { error } = await supabase.from('push_subscriptions').upsert({
      user_name:  userName,
      endpoint:   sub.endpoint,
      p256dh:     sub.keys.p256dh,
      auth:       sub.keys.auth,
      updated_at: new Date().toISOString()
    }, { onConflict: 'endpoint' })

    if (error) console.error('Erreur sauvegarde push:', error)
    else console.log('✅ Push enregistré pour', userName)

    return true
  } catch (err) {
    console.error('Erreur push:', err)
    return false
  }
}

export async function unregisterPush() {
  try {
    const reg = await navigator.serviceWorker.getRegistration('/love/sw.js')
    if (!reg) return
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return
    await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
    await sub.unsubscribe()
    console.log('✅ Push désenregistré')
  } catch (err) {
    console.error('Erreur unregister push:', err)
  }
}
