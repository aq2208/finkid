import { defineConfig } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset: {
    transparent: {
      sizes: [64, 192, 512],
      favicons: [[64, 'favicon.ico']],
      resizeOptions: { fit: 'contain', background: '#FF6B5B' },
    },
    maskable: {
      sizes: [512],
      resizeOptions: { fit: 'cover', background: '#FF6B5B' },
      padding: 0,
    },
    apple: {
      sizes: [180],
      resizeOptions: { fit: 'cover', background: '#FF6B5B' },
      padding: 0,
    },
  },
  images: ['public/pwa-icon.svg'],
})
