export function buildAuthHeaders(token) {
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

const ACCESS_TOKEN_KEY = 'auth.access_token'
const REFRESH_TOKEN_KEY = 'auth.refresh_token'

function getStoredToken(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function setStoredToken(key, value) {
  try {
    if (!value) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // ignore
  }
}

function notifyAuthClear() {
  try {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new Event('auth:clear'))
    }
  } catch {
    // ignore
  }
}

async function safeReadText(res) {
  try {
    return await res.text()
  } catch {
    return ''
  }
}

function isTokenExpiredError(status, text) {
  if (status !== 401) return false
  const hay = String(text || '')
  return (
    hay.includes('token_not_valid') &&
    (hay.includes('Token is expired') || hay.includes('token is expired') || hay.includes('expired'))
  )
}

async function refreshAccessToken(refresh) {
  const res = await fetch('/api/auth/refresh/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  })
  if (!res.ok) {
    const text = await safeReadText(res)
    throw new Error(`API error ${res.status}: ${text}`)
  }
  return res.json()
}

export async function apiRequest(options) {
  const url = options.path.startsWith('http')
    ? options.path
    : `/api${options.path.startsWith('/') ? '' : '/'}${options.path}`

  const doFetch = async (tokenOverride) => {
    return fetch(url, {
      method: options.method,
      headers: {
        ...(tokenOverride ? buildAuthHeaders(tokenOverride) : {}),
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(options.headers ?? {}),
      },
      body:
        options.body instanceof FormData
          ? options.body
          : options.body
            ? JSON.stringify(options.body)
            : undefined,
    })
  }

  // If caller holds an older token, prefer the latest token in storage.
  let token = options.token ?? null
  const storedAccess = getStoredToken(ACCESS_TOKEN_KEY)
  if (storedAccess && storedAccess !== token) token = storedAccess

  let res = await doFetch(token)

  if (!res.ok) {
    const text = await safeReadText(res)

    // Auto-refresh once on expired access tokens.
    if (!options._retry && isTokenExpiredError(res.status, text)) {
      const refresh = options.refreshToken ?? getStoredToken(REFRESH_TOKEN_KEY)
      if (!refresh) {
        // Most likely the user logged in before refresh_token support existed.
        setStoredToken(ACCESS_TOKEN_KEY, null)
        setStoredToken(REFRESH_TOKEN_KEY, null)
        notifyAuthClear()
        throw new Error(`API error ${res.status}: ${text}`)
      }

      try {
        const refreshed = await refreshAccessToken(refresh)
        const newAccess = refreshed?.access
        const newRefresh = refreshed?.refresh
        if (typeof newAccess === 'string' && newAccess.length > 0) {
          // Persist tokens so future calls can pick them up.
          setStoredToken(ACCESS_TOKEN_KEY, newAccess)
          if (typeof newRefresh === 'string' && newRefresh.length > 0) {
            setStoredToken(REFRESH_TOKEN_KEY, newRefresh)
          }

          if (typeof options.onTokenUpdate === 'function') {
            options.onTokenUpdate({ access: newAccess, refresh: newRefresh })
          }

          return apiRequest({ ...options, token: newAccess, _retry: true })
        }
      } catch (e) {
        setStoredToken(ACCESS_TOKEN_KEY, null)
        setStoredToken(REFRESH_TOKEN_KEY, null)
        notifyAuthClear()
        throw e
      }
    }

    throw new Error(`API error ${res.status}: ${text}`)
  }

  return res.json()
}

