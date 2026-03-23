import { Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { getMe } from '../api/rest'
import { useAuth } from './AuthContext'

export function AuthStatusBar() {
  const { accessToken, clearAuth } = useAuth()
  const [me, setMe] = useState<any | null>(null)

  useEffect(() => {
    if (!accessToken) {
      setMe(null)
      return
    }
    let mounted = true
    ;(async () => {
      try {
        const user = await getMe(accessToken)
        if (mounted) setMe(user)
      } catch {
        if (mounted) setMe(null)
      }
    })()
    return () => {
      mounted = false
    }
  }, [accessToken])

  const displayName = useMemo(() => {
    const fullName = [me?.first_name, me?.last_name].filter(Boolean).join(' ').trim()
    if (fullName) return fullName
    if (me?.username) return me.username
    if (me?.email) return me.email
    return 'Account'
  }, [me])

  if (!accessToken) {
    return (
      <div className="flex shrink-0 items-center gap-2">
        <Link
          to="/auth/login"
          className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-blue-700 dark:text-gray-400 dark:hover:text-blue-300"
        >
          Login
        </Link>
        <Link
          to="/auth/register"
          className="rounded-md bg-blue-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
        >
          Register
        </Link>
      </div>
    )
  }

  return (
    <div className="flex shrink-0 items-center gap-3">
      <Link
        to="/profile"
        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-700 dark:text-gray-400 dark:hover:text-blue-300"
      >
        <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
        {displayName}
      </Link>
      <button
        type="button"
        className="rounded-md border border-gray-200 px-3.5 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        onClick={() => clearAuth()}
      >
        Logout
      </button>
    </div>
  )
}
