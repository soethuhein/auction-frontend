import { API_BASE_URL } from './env'

type ApiRequestOptions = {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  path: string
  token?: string | null
  body?: any
  headers?: Record<string, string>
}

export function buildAuthHeaders(token?: string | null): Record<string, string> {
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

function buildApiUrl(path: string): string {
  if (path.startsWith('http')) return path
  const p = path.startsWith('/') ? path : `/${path}`
  const apiPath = p.startsWith('/api') ? p : `/api${p}`
  return API_BASE_URL ? `${API_BASE_URL}${apiPath}` : apiPath
}

export async function apiRequest<T>(options: ApiRequestOptions): Promise<T> {
  const url = buildApiUrl(options.path)

  const res = await fetch(url, {
    method: options.method,
    headers: {
      ...(options.token ? buildAuthHeaders(options.token) : {}),
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers ?? {}),
    },
    body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API error ${res.status}: ${text}`)
  }

  return (await res.json()) as T
}

