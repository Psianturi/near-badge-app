import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills' // ⬅️ ganti ke named import

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // include polyfills untuk Buffer, process, global, crypto, dsb.
      protocolImports: true,
    })
  ],
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['buffer', 'process'],
  },
})
