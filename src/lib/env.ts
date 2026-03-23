/** Backend API base URL (e.g. http://127.0.0.1:8000).
 * In Vite dev, `import.meta.env` is loaded from `.env`.
 * In a prebuilt `dist` scenario, env variables can be missing at runtime, so we
 * keep a safe fallback to your local backend.
 */
function normalizeApiBaseUrl(value: string | undefined | null): string {
  const v = value?.trim()
  if (!v) return ''
  return v.replace(/\/$/, '')
}

export const API_BASE_URL = (() => {
  const buildTime = import.meta.env.VITE_API_BASE_URL as string | undefined

  // Optional runtime override for static serving / debugging.
  const runtime =
    typeof window !== 'undefined'
      ? ((window as any).__API_BASE_URL__ as string | undefined) ??
        ((window as any).__VITE_API_BASE_URL__ as string | undefined)
      : undefined

  return normalizeApiBaseUrl(runtime) || normalizeApiBaseUrl(buildTime) || 'http://127.0.0.1:8000'
})()

/**
 * Turn relative media paths (e.g. /media/...) into absolute URLs when API is on another origin.
 * In dev with Vite proxy, relative /media still works; with VITE_API_BASE_URL set, use full URL.
 */
export function resolveMediaUrl(url: string | undefined | null): string | undefined {
  if (url == null || url === '') return undefined
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (API_BASE_URL && url.startsWith('/')) return `${API_BASE_URL}${url}`
  return url
}

/** WebSocket base URL. Falls back to API_BASE_URL with ws/wss, or same-origin. */
export function getWsBaseUrl(): string {
  const ws = (import.meta.env.VITE_WS_BASE_URL as string | undefined)?.replace(/\/$/, '')
  if (ws) return ws
  if (API_BASE_URL) {
    return API_BASE_URL.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')
  }
  const proto = typeof location !== 'undefined' && location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = typeof location !== 'undefined' ? location.host : 'localhost'
  return `${proto}//${host}`
}
