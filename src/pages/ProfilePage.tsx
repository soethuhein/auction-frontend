import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { getMe } from '../app/api/rest'
import { useAuth } from '../app/auth/AuthContext'

export function ProfilePage() {
  const { accessToken } = useAuth()
  const navigate = useNavigate()
  const [me, setMe] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken) {
      navigate({ to: '/auth/login' })
      return
    }

    let mounted = true
    ;(async () => {
      try {
        const user = await getMe(accessToken)
        if (mounted) setMe(user)
      } catch (e: any) {
        if (mounted) setError(e?.message ?? 'Failed to load profile')
      }
    })()

    return () => {
      mounted = false
    }
  }, [accessToken, navigate])

  const fullName = [me?.first_name, me?.last_name].filter(Boolean).join(' ').trim()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">My profile</h1>

      {error ? (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="rounded border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Full name</dt>
            <dd className="font-medium">{fullName || '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Username</dt>
            <dd className="font-medium">{me?.username || '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Email</dt>
            <dd className="font-medium">{me?.email || '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Phone</dt>
            <dd className="font-medium">{me?.phone || '—'}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
