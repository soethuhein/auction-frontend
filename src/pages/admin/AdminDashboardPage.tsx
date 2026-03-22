import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '../../app/auth/AuthContext'
import { getMe } from '../../app/api/rest'

export function AdminDashboardPage() {
  const { accessToken } = useAuth()
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!accessToken) {
        navigate({ to: '/auth/login' })
        return
      }
      try {
        const me = await getMe(accessToken)
        const admin = Boolean(me?.is_superuser || me?.is_staff)
        if (mounted) setIsAdmin(admin)
        if (mounted && !admin) navigate({ to: '/', search: { category: undefined } })
      } catch {
        if (mounted) navigate({ to: '/auth/login' })
      }
    })()

    return () => {
      mounted = false
    }
  }, [accessToken, navigate])

  if (isAdmin === null) {
    return <div className="text-sm text-gray-600">Checking admin access...</div>
  }

  if (!isAdmin) return null

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <div className="rounded border border-gray-200 p-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-300">
        Backend currently exposes endpoints for "my" data only. This admin UI
        shows your Items, Auctions, and Bids using the authenticated endpoints.
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          to="/admin/items"
          className="rounded border border-gray-200 p-4 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
        >
          <div className="text-sm font-semibold">Items</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Manage item listings
          </div>
        </Link>
        <Link
          to="/admin/auctions"
          className="rounded border border-gray-200 p-4 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
        >
          <div className="text-sm font-semibold">Auctions</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Your auction lifecycle
          </div>
        </Link>
        <Link
          to="/admin/bids"
          className="rounded border border-gray-200 p-4 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
        >
          <div className="text-sm font-semibold">Bids</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Your bid history
          </div>
        </Link>
      </div>
    </div>
  )
}

