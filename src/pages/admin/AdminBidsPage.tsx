import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '../../app/auth/AuthContext'
import { getMe, listMyBids } from '../../app/api/rest'

export function AdminBidsPage() {
  const { accessToken } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<any | null>(null)
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

        const res = await listMyBids(accessToken)
        if (mounted) setData(res)
      } catch (e: any) {
        if (mounted) setError(e?.message ?? 'Failed to load bids')
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

  const bids = data?.results ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin - Bids</h1>
        <Link to="/admin" className="text-sm text-purple-700 hover:underline">
          Back
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
              <th className="p-3">When</th>
            </tr>
          </thead>
          <tbody>
            {bids.map((b: any) => (
              <tr key={b.id} className="border-t border-gray-200 dark:border-gray-800">
                <td className="p-3">
                  <Link
                    to="/auctions/$auctionId"
                    params={{ auctionId: b.auction?.id ?? b.auction_id }}
                    className="text-sm text-purple-700 hover:underline"
                  >
                    {b.auction?.item?.title ?? 'Auction'}
                  </Link>
                </td>
                <td className="p-3">{b.amount}</td>
                <td className="p-3 text-gray-600 dark:text-gray-400">
                  {b.created_at ? new Date(b.created_at).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
            {bids.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-4 text-sm text-gray-600 dark:text-gray-400">
                  No bids yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

