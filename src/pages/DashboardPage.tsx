import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { listAuctions } from '../app/api/rest'
import { AuctionCard } from '../components/AuctionCard'

export function DashboardPage() {
  const [data, setData] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await listAuctions()
        if (mounted) setData(res)
      } catch (e: any) {
        if (mounted) setError(e?.message ?? 'Failed to load auctions')
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const auctions = useMemo(() => data?.results ?? [], [data])

  return (
    <div className="space-y-8">
      <section
        className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-950 shadow-sm dark:border-gray-800"
        aria-label="Hero"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'url(https://themeslay.com/wp-content/uploads/2022/08/Bidout-Multivendor-Bid-and-Auctions-HTML-Template.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div className="absolute inset-0 bg-gray-950" style={{ opacity: 0.72 }} />

        <div className="relative p-6 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs text-gray-900">
                Live Auctions
                <span className="h-1 w-1 rounded-full bg-purple-600" />
                {auctions.length} items
              </div>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
                Auction Management
              </h1>
              <p className="mt-3 text-white/90">
                Browse active auctions, place bids, and follow the market in real-time.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/auctions/my"
                  className="rounded bg-purple-600 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-700"
                >
                  My Auctions
                </Link>
                <Link
                  to="/items/new"
                  className="rounded border border-white/30 bg-white/10 px-5 py-2 text-sm font-semibold text-white hover:bg-white/15"
                >
                  Create Auction
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {auctions.length === 0 ? (
        <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
          No auctions found.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {auctions.map((a: any) => (
            <AuctionCard key={a.id} auction={a} />
          ))}
        </div>
      )}
    </div>
  )
}

