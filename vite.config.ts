import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
