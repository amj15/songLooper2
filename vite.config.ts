import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync('./certs/localhost-key.pem'),
      cert: fs.readFileSync('./certs/localhost.pem')
    },
    host: 'localhost',
    port: 5175,
    strictPort: false
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Skip TypeScript warnings in production build
        if (warning.code === 'TS_BUILD_INFO_MISSING') return;
        warn(warning);
      }
    }
  }
})
