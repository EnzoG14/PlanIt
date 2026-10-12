import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// Servidor aparte para comparar direcciones de UI. Reutiliza React/Vite de la raíz del repo.
const root = fileURLToPath(new URL('.', import.meta.url))
const repoRoot = fileURLToPath(new URL('..', import.meta.url))

export default defineConfig({
  root,
  cacheDir: `${repoRoot}node_modules/.vite-design-lab`,
  plugins: [react()],
  server: { port: 5180, strictPort: true, fs: { allow: [repoRoot] } },
  build: { outDir: `${repoRoot}node_modules/.design-lab-dist`, emptyOutDir: true },
})
