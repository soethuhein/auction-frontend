import { useEffect, useMemo, useState } from 'react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '../app/auth/AuthContext'
import { listMyAuctions } from '../app/api/rest'
import { AuctionCard } from '../components/AuctionCard'

const myAuctionsRouteApi = getRouteApi('/auctions/my')

export function MyAuctionsPage() {
  const { accessToken } = useAuth()
  const navigate = useNavigate()
  const { status } = myAuctionsRouteApi.useSearch()
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
        const res = await listMyAuctions(accessToken)
        if (mounted) setData(res)
      } catch (e: any) {
        if (mounted) setError(e?.message ?? 'Failed to load my auctions')
      }
    })()

    return () => {
      mounted = false
    }
  }, [accessToken, navigate])

  const auctions = data?.results ?? []
  const filteredAuctions = useMemo(() => {
    if (status === 'active' || status === 'ended' || status === 'draft') {
      return auctions.filter((a: any) => a.status === status)
    }
    return auctions
  }, [auctions, status])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Auctions</h1>
        <Link to="/auctions/new" className="rounded bg-purple-600 px-3 py-2 text-sm text-white hover:bg-purple-700">
          Create draft auction
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          to="/auctions/my"
          search={{ status: 'all' }}
          className={
            status === 'all'
              ? 'rounded-md bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-800 dark:bg-blue-950/60 dark:text-blue-200'
              : 'rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-900'
          }
        >
          All
        </Link>
        <Link
          to="/auctions/my"
          search={{ status: 'active' }}
          className={
            status === 'active'
              ? 'rounded-md bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-800 dark:bg-blue-950/60 dark:text-blue-200'
              : 'rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-900'
          }
        >
          Active
        </Link>
        <Link
          to="/auctions/my"
          search={{ status: 'ended' }}
          className={
            status === 'ended'
              ? 'rounded-md bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-800 dark:bg-blue-950/60 dark:text-blue-200'
              : 'rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-900'
          }
        >
          Ended
        </Link>
        <Link
          to="/auctions/my"
          search={{ status: 'draft' }}
          className={
            status === 'draft'
              ? 'rounded-md bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-800 dark:bg-blue-950/60 dark:text-blue-200'
              : 'rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-900'
          }
        >
          Draft
        </Link>
      </div>

      {error ? (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {filteredAuctions.length === 0 ? (
        <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
          No auctions yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAuctions.map((a: any) => (
            <AuctionCard key={a.id} auction={a} />
          ))}
        </div>
      )}
    </div>
  )
}

