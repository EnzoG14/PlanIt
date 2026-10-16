
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const {
    VITE_SUPABASE_PUBLISHABLE_KEY: key,
    VITE_MAPBOX_ACCESS_TOKEN: mapToken,
    VITE_VAPID_PUBLIC_KEY: vapidPublicKey,
  } = loadEnv(mode, process.cwd(), 'VITE_')
  if (mapToken && mapToken !== 'replace_with_public_mapbox_token' && !/^pk\.[A-Za-z0-9._-]+$/.test(mapToken)) {
    throw new Error('VITE_MAPBOX_ACCESS_TOKEN debe ser público pk. No se generará un bundle con tokens secretos o inválidos.')
  }
  // Rechazar claves no públicas antes de que Vite las incluya en el bundle.
  if (key && key !== 'replace_with_project_publishable_key' && !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) {
    throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY debe ser una clave publishable. No se generará un bundle con claves no públicas.')
  }
  if (vapidPublicKey && vapidPublicKey !== 'replace_with_vapid_public_key' && !/^B[A-Za-z0-9_-]{85,87}$/.test(vapidPublicKey)) {
    throw new Error('VITE_VAPID_PUBLIC_KEY debe ser una clave pública VAPID P-256 base64url sin comprimir (65 bytes). Nunca incluyas la clave privada en VITE_*.')
  }
  return {
    server: {
      allowedHosts: ['celibate-relapse-snowdrift.ngrok-free.dev'],
    },
    plugins: [
      react(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'autoUpdate',
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        },

        manifest: {
          name: 'PlanIt',
          short_name: 'PlanIt',
          description: 'Descubrí, organizá y participá en eventos.',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          lang: 'es-AR',
          theme_color: '#060b27',
          background_color: '#060b27',

          icons: [
            {
              src: '/icons/pwa-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/icons/pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/icons/pwa-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
      }),
    ],
  }
})
