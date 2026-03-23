import { useEffect, useState } from 'react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '../app/auth/AuthContext'
import { listMyBids } from '../app/api/rest'

const myBidsRouteApi = getRouteApi('/auctions/my-bids')

export function MyBidsPage() {
  const { accessToken } = useAuth()
  const navigate = useNavigate()
  const { filter } = myBidsRouteApi.useSearch()
  const wonOnly = filter === 'won'

  const [data, setData] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken) {
      navigate({ to: '/auth/login' })
      return
    }

    let mounted = true
    ;(async () => {
      try {
        const res = await listMyBids(accessToken, { won: wonOnly })
        if (mounted) setData(res)
      } catch (e: any) {
        if (mounted) setError(e?.message ?? 'Failed to load bids')
      }
    })()

    return () => {
      mounted = false
    }
  }, [accessToken, navigate, wonOnly])

  const bids = data?.results ?? []

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">My bid history</h1>

      <div className="flex flex-wrap gap-2">
        <Link
          to="/auctions/my-bids"
          search={{ filter: 'all' }}
          className={
            'rounded-md px-3 py-1.5 text-sm font-medium ' +
            (!wonOnly
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200'
              : 'border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-900')
          }
        >
          All bids
        </Link>
        <Link
          to="/auctions/my-bids"
          search={{ filter: 'won' }}
          className={
            'rounded-md px-3 py-1.5 text-sm font-medium ' +
            (wonOnly
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200'
              : 'border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-900')
          }
        >
          Won auctions
        </Link>
      </div>

      {error ? (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="p-3">Auction</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">When</th>
            </tr>
          </thead>
          <tbody>
            {bids.map((b: any) => (
              <tr key={b.id} className="border-t border-gray-200 dark:border-gray-800">
                <td className="p-3">
                  <Link
                    to="/auctions/$auctionId"
                    params={{ auctionId: b.auction?.id }}
                    className="font-medium text-purple-700 hover:underline dark:text-purple-400"
                  >
                    {b.auction?.item_title ?? 'Auction'}
                  </Link>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{b.auction?.status}</div>
                </td>
                <td className="p-3">{b.amount}</td>
                <td className="p-3">
                  {b.is_won ? (
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                      Won
                    </span>
                  ) : b.is_winning ? (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
                      Highest bid
                    </span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">Outbid</span>
                  )}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-400">
                  {b.created_at ? new Date(b.created_at).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
            {bids.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-sm text-gray-600 dark:text-gray-400">
                  {wonOnly ? 'No won auctions yet.' : 'No bids yet.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
