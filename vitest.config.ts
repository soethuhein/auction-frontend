import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    pool: 'threads',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Keep empty for now to avoid transformer issues in this environment.
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    css: true,
  },
})

