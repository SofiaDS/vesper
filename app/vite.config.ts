import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Usa manifest.webmanifest esistente in public/
      manifest: false,
      // injectManifest: usa src/sw.ts come entry point del SW (gestisce push + precache)
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        // Gli screenshot servono solo alla UI d'installazione: non precacharli,
        // altrimenti ogni utente scaricherebbe ~2 MB di immagini inutili.
        globIgnores: ['**/screenshots/**'],
      },
    }),
  ],
})
