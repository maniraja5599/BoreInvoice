import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Borewell Invoice Generator',
        short_name: 'Borewell Bill',
        description: 'Invoice and Quotation generator for Anjaneya Borewells',
        theme_color: '#0284c7',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'company_logo.jpg',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: 'company_logo.jpg',
            sizes: '512x512',
            type: 'image/jpeg'
          },
          {
            src: 'company_logo.jpg',
            sizes: 'any',
            type: 'image/jpeg'
          }
        ]
      }
    })
  ],
})
