import { API_BASE_URL } from './env'

type ApiRequestOptions = {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  path: string
  token?: string | null
  refreshToken?: string | null
  onTokenUpdate?: (tokens: { access: string; refresh?: string | null }) => void
  _retry?: boolean
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

const ACCESS_TOKEN_KEY = 'auth.access_token'
const REFRESH_TOKEN_KEY = 'auth.refresh_token'

function getStoredToken(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function setStoredToken(key: string, value: string | null): void {
  try {
    if (!value) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // ignore
  }
}

function notifyAuthClear(): void {
  try {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new Event('auth:clear'))
    }
  } catch {
    // ignore
  }
}

function notifyTokensUpdated(): void {
  try {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new Event('auth:tokens-updated'))
    }
  } catch {
    // ignore
  }
}

async function safeReadText(res: Response): Promise<string> {
  try {
    return await res.text()
  } catch {
    return ''
  }
}

const BANNED_ACCOUNT_MESSAGE =
  'This user account has been banned by an administrator.'

function parseApiErrorJson(text: string): { code?: string; detail?: unknown } | null {
  try {
    const o = JSON.parse(text) as unknown
    if (o && typeof o === 'object' && !Array.isArray(o)) {
      return o as { code?: string; detail?: unknown }
    }
  } catch {
    // ignore
  }
  return null
}

/** Maps known API error payloads to user-facing copy; otherwise returns null. */
export function userFacingApiErrorMessage(status: number, bodyText: string): string | null {
  const parsed = parseApiErrorJson(bodyText)
  if (!parsed) return null
  if (parsed.code === 'user_inactive') return BANNED_ACCOUNT_MESSAGE
  if (status === 401 && typeof parsed.detail === 'string') {
    const d = parsed.detail.toLowerCase()
    if (d.includes('inactive') || d.includes('not active')) {
      return BANNED_ACCOUNT_MESSAGE
    }
  }
  return null
}

function throwApiError(status: number, text: string): never {
  const friendly = userFacingApiErrorMessage(status, text)
  if (friendly) throw new Error(friendly)
  throw new Error(`API error ${status}: ${text}`)
}

function isTokenExpiredError(status: number, text: string): boolean {
  if (status !== 401) return false
  const hay = String(text || '')
  return (
    hay.includes('token_not_valid') &&
    (hay.includes('Token is expired') || hay.includes('token is expired') || hay.includes('expired'))
  )
}

async function refreshAccessToken(refresh: string): Promise<{ access?: string; refresh?: string }> {
  const res = await fetch(buildApiUrl('/auth/refresh/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  })
  if (!res.ok) {
    const text = await safeReadText(res)
    throwApiError(res.status, text)
  }
  return (await res.json()) as { access?: string; refresh?: string }
}

export async function apiRequest<T>(options: ApiRequestOptions): Promise<T> {
  const url = buildApiUrl(options.path)

  const doFetch = async (tokenOverride: string | null) =>
    fetch(url, {
      method: options.method,
      headers: {
        ...(tokenOverride ? buildAuthHeaders(tokenOverride) : {}),
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(options.headers ?? {}),
      },
      body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined,
    })

  // Prefer the latest access token in storage when caller passes stale in-memory token.
  let token = options.token ?? null
  const storedAccess = getStoredToken(ACCESS_TOKEN_KEY)
  if (storedAccess && storedAccess !== token) token = storedAccess

  const res = await doFetch(token)

  if (!res.ok) {
    const text = await safeReadText(res)

    if (!options._retry && isTokenExpiredError(res.status, text)) {
      const refresh = options.refreshToken ?? getStoredToken(REFRESH_TOKEN_KEY)
      if (!refresh) {
        setStoredToken(ACCESS_TOKEN_KEY, null)
        setStoredToken(REFRESH_TOKEN_KEY, null)
        notifyAuthClear()
        throwApiError(res.status, text)
      }

      try {
        const refreshed = await refreshAccessToken(refresh)
        const newAccess = refreshed?.access
        const newRefresh = refreshed?.refresh
        if (typeof newAccess === 'string' && newAccess.length > 0) {
          setStoredToken(ACCESS_TOKEN_KEY, newAccess)
          if (typeof newRefresh === 'string' && newRefresh.length > 0) {
            setStoredToken(REFRESH_TOKEN_KEY, newRefresh)
          }
          notifyTokensUpdated()
          if (typeof options.onTokenUpdate === 'function') {
            options.onTokenUpdate({ access: newAccess, refresh: newRefresh ?? null })
          }
          return apiRequest<T>({ ...options, token: newAccess, _retry: true })
        }
      } catch (e) {
        setStoredToken(ACCESS_TOKEN_KEY, null)
        setStoredToken(REFRESH_TOKEN_KEY, null)
        notifyAuthClear()
        throw e
      }
    }

    throwApiError(res.status, text)
  }

  return (await res.json()) as T
}

