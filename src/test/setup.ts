import '@testing-library/jest-dom'

// Provide a basic URL so fetch() and URL parsing work consistently in jsdom.
const g = globalThis as any
if (!g.location) {
  g.location = new URL('http://localhost/')
}

