import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '../../app/auth/AuthContext'
import { getMe, listAdminBids } from '../../app/api/rest'

const PAGE_SIZE = 20

function bidderLabel(bidder: { first_name?: string; username?: string } | null | undefined): string {
  if (!bidder) return '—'
  const name = bidder.first_name?.trim()
  return name || bidder.username || '—'
}

function formatAmount(value: string | number | null | undefined): string {
  if (value == null || value === '') return '—'
  const n = typeof value === 'string' ? parseFloat(value) : value
  if (Number.isNaN(n)) return String(value)
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function AdminBidsPage() {
  const { accessToken } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<any | null>(null)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    if (!accessToken) {
      navigate({ to: '/auth/login' })
      return
    }
    let mounted = true
    ;(async () => {
      try {
        const me = await getMe(accessToken)
        const admin = Boolean(me?.is_superuser || me?.is_staff)
        if (!admin) {
          if (mounted) {
            setIsAdmin(false)
            navigate({ to: '/', search: { category: undefined } })
          }
          return
        }
        if (mounted) setIsAdmin(true)
      } catch {
        if (mounted) setIsAdmin(false)
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
      setError(null)
      try {
        const res = await listAdminBids(accessToken, page)
        if (mounted) setData(res)
      } catch (e: any) {
        if (mounted) setError(e?.message ?? 'Failed to load bids')
      }
    })()
    return () => {
      mounted = false
    }
  }, [accessToken, isAdmin, page])

  if (isAdmin === null) {
    return <div className="text-sm text-gray-600">Checking admin access...</div>
  }
  if (!isAdmin) return null

  const bids = data?.results ?? []
  const totalCount = typeof data?.count === 'number' ? data.count : bids.length
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin - Bids</h1>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        All bids across the platform (newest first). Total:{' '}
        <span className="font-semibold text-gray-900 dark:text-white">{totalCount}</span>
      </p>

      {error ? (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="p-3">When</th>
              <th className="p-3">Bidder</th>
              <th className="p-3">Auction</th>
              <th className="p-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bids.map((b: any) => (
              <tr key={b.id} className="border-t border-gray-200 dark:border-gray-800">
                <td className="whitespace-nowrap p-3 text-gray-600 dark:text-gray-400">
                  {b.created_at ? new Date(b.created_at).toLocaleString() : '—'}
                </td>
                <td className="p-3 text-gray-800 dark:text-gray-200">{bidderLabel(b.bidder)}</td>
                <td className="p-3">
                  {b.auction?.id ? (
                    <Link
                      to="/auctions/$auctionId"
                      params={{ auctionId: String(b.auction.id) }}
                      className="font-medium text-purple-700 hover:underline dark:text-purple-300"
                    >
                      {b.auction?.item_title ?? 'Auction'}
                    </Link>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="p-3 tabular-nums">{formatAmount(b.amount)}</td>
              </tr>
            ))}
            {bids.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-sm text-gray-600 dark:text-gray-400">
                  No bids yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {totalCount > PAGE_SIZE ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600"
          >
            Previous
          </button>
          <span className="text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  )
}
