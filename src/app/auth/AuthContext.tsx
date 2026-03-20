import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

type AuthContextValue = {
  accessToken: string | null
  refreshToken: string | null
  setAccessToken: (token: string | null) => void
  setRefreshToken: (token: string | null) => void
  clearAuth: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const ACCESS_TOKEN_KEY = 'auth.access_token'
const REFRESH_TOKEN_KEY = 'auth.refresh_token'

export function AuthProvider(props: { children: React.ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY)
    } catch {
      return null
    }
  })

  const [refreshToken, setRefreshTokenState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY)
    } catch {
      return null
    }
  })

  const setAccessToken = (token: string | null) => {
    setAccessTokenState(token)
    try {
      if (!token) localStorage.removeItem(ACCESS_TOKEN_KEY)
      else localStorage.setItem(ACCESS_TOKEN_KEY, token)
    } catch {
      // ignore storage errors
    }
  }

  const setRefreshToken = (token: string | null) => {
    setRefreshTokenState(token)
    try {
      if (!token) localStorage.removeItem(REFRESH_TOKEN_KEY)
      else localStorage.setItem(REFRESH_TOKEN_KEY, token)
    } catch {
      // ignore storage errors
    }
  }

  const clearAuth = () => {
    // Keep state in sync with localStorage.
    setAccessToken(null)
    setRefreshToken(null)
  }

  useEffect(() => {
    const onClear = () => clearAuth()
    window.addEventListener('auth:clear', onClear)
    return () => window.removeEventListener('auth:clear', onClear)
  }, [])

  const value = useMemo(
    () => ({
      accessToken,
      refreshToken,
      setAccessToken,
      setRefreshToken,
      clearAuth,
    }),
    [accessToken, refreshToken],
  )

  return <AuthContext.Provider value={value} {...props} />
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

