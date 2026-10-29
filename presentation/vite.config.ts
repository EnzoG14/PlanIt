import { defineConfig } from 'vite'

// This deck is independent from the parent React/PWA configuration.
export default defineConfig({ server: { host: '127.0.0.1', fs: { strict: true } } })
