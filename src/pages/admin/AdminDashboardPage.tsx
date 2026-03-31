import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '../../app/auth/AuthContext'
import { getAdminStats, getMe, type AdminStats } from '../../app/api/rest'
import { DEFAULT_BROWSE_SEARCH } from '../../app/browseSearchDefaults'

function formatMoney(value: string) {
  const n = Number.parseFloat(value)
  if (Number.isNaN(n)) return value
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">
        {value}
      </div>
      {hint ? (
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">{hint}</div>
      ) : null}
    </div>
  )
}

export function AdminDashboardPage() {
  const { accessToken } = useAuth()
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)

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

  useEffect(() => {
    if (!accessToken || !isAdmin) return
    let mounted = true
    ;(async () => {
      try {
        const s = await getAdminStats(accessToken)
        if (mounted) {
          setStats(s)
          setStatsError(null)
        }
      } catch {
        if (mounted) {
          setStats(null)
          setStatsError('Could not load platform statistics.')
        }
      }
    })()
    return () => {
      mounted = false
    }
  }, [accessToken, isAdmin])

  if (isAdmin === null) {
    return <div className="text-sm text-gray-600">Checking admin access...</div>
  }

  if (!isAdmin) return null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <div className="rounded border border-gray-200 p-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-300">
        Platform-wide metrics below require a staff account. Quick links still use
        your Items, Auctions, and Bids from the standard authenticated endpoints.
      </div>

      {statsError ? (
        <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          {statsError}
        </div>
      ) : null}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Overview
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StatCard
            label="Total users"
            value={stats?.total_users ?? '—'}
          />
          <StatCard
            label="Active auctions"
            value={stats?.active_auctions ?? '—'}
          />
          <StatCard
            label="Completed auctions"
            value={stats?.completed_auctions ?? '—'}
          />
          <StatCard
            label="Bids today"
            value={stats?.bids_today ?? '—'}
          />
          <StatCard
            label="Total revenue"
            value={stats ? formatMoney(stats.total_revenue) : '—'}
            hint="Sum of winning amounts on ended auctions"
          />
          <StatCard
            label="Commission"
            value={stats ? formatMoney(stats.commission) : '—'}
            hint={
              stats
                ? `${(stats.commission_rate * 100).toFixed(1)}% of revenue (COMMISSION_RATE)`
                : undefined
            }
          />
          <StatCard
            label="Pending reports"
            value={stats?.pending_reports ?? '—'}
            hint="Requires moderation API"
          />
          <StatCard
            label="Pending item approvals"
            value={stats?.pending_item_approvals ?? '—'}
            hint="Requires approval workflow"
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Your data
        </h2>
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
            search={DEFAULT_BROWSE_SEARCH}
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
    </div>
  )
}
