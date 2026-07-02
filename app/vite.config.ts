import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Was ['favicon.ico', 'apple-touch-icon.png', 'icons/*.png'] — none of
      // those three paths match anything in public/ (no favicon.ico or
      // apple-touch-icon.png exist, and the PNGs live flat in public/, not
      // under an icons/ subfolder). vite-plugin-pwa was silently precaching
      // nothing for the icon set. Fixed to the files that actually exist.
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Mosaic',
        short_name: 'Mosaic',
        description: "Made of the moments you'd otherwise forget.",
        // Cream base — matches bg-base in tailwind.config.ts. These are
        // static (manifest.json can't react to the in-app theme toggle),
        // so they're set to the light default; the live status bar color
        // is handled separately via the <meta name="theme-color"> tag.
        theme_color: '#FAF3E7',
        background_color: '#FAF3E7',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        // Was 'icons/icon-192.png' / 'icons/icon-512.png' — there's no
        // icons/ subfolder in public/, so the manifest's icon entries 404'd
        // and installed PWAs fell back to a generic browser icon instead of
        // the Mosaic mark. Paths now match where the files actually live
        // (public/icon-192.png, public/icon-512.png — same as the <link
        // rel="icon"> in index.html).
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/www\.googleapis\.com\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'drive-api',
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
  },
})
