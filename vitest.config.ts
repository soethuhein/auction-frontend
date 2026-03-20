import { defineConfig } from 'vitest/config'

export default defineConfig({
  oxc: false,
  test: {
    environment: 'node',
    pool: 'threads',
    globals: true,
    // Keep empty for now to avoid transformer issues in this environment.
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    css: true,
  },
})

