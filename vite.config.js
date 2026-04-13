import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/love/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Le SW est généré par vite-plugin-pwa — sw.js dans /public n'est plus utilisé
      // On garde workbox en mode minimal pour ne pas casser le push
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
      manifest: {
        name: 'À Deux',
        short_name: 'À Deux',
        description: 'Notre espace privé à deux',
        // ⚠️ Ces 3 champs sont critiques pour iOS Web Push
        id:        '/love/',
        start_url: '/love/',
        scope:     '/love/',
        display:   'standalone',
        orientation:      'portrait',
        theme_color:      '#0f0c1a',
        background_color: '#0f0c1a',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    })
  ]
})
