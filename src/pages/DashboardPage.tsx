import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { listAuctions, listCategories } from '../app/api/rest'
import { AuctionCard } from '../components/AuctionCard'
import { DEFAULT_BROWSE_SEARCH } from '../app/browseSearchDefaults'
import { indexRoute } from '../app/router'
import heroImg from '../assets/hero.webp'

const CATEGORY_COLORS = [
  'bg-blue-100 dark:bg-blue-950/50',
  'bg-violet-100 dark:bg-violet-950/50',
  'bg-amber-100 dark:bg-amber-950/50',
  'bg-rose-100 dark:bg-rose-950/50',
  'bg-emerald-100 dark:bg-emerald-950/50',
  'bg-sky-100 dark:bg-sky-950/50',
  'bg-fuchsia-100 dark:bg-fuchsia-950/50',
  'bg-orange-100 dark:bg-orange-950/50',
]

export function DashboardPage() {
  const { category } = indexRoute.useSearch()
  const [data, setData] = useState<any | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await listAuctions({
          ...(category ? { category } : {}),
          status: 'active',
        })
        if (mounted) setData(res)
      } catch (e: any) {
        if (mounted) setError(e?.message ?? 'Failed to load auctions')
      }
    })()
    return () => {
      mounted = false
    }
  }, [category])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const list = await listCategories()
        if (mounted) setCategories(list)
      } catch {
        // categories are optional for display
      }
    })()
    return () => { mounted = false }
  }, [])

  const auctions = useMemo(() => data?.results ?? [], [data])
  const activeCategory = useMemo(
    () => (category ? categories.find((c: any) => c.slug === category) : null),
    [category, categories]
  )

  return (
    <div className="space-y-8">
      <section
        className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-950 shadow-sm dark:border-gray-800"
        aria-label="Hero"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${heroImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div className="absolute inset-0 bg-gray-950" style={{ opacity: 0.5 }} />

        <div className="relative p-6 md:p-10">
          <div
            className="absolute right-6 top-6 z-10 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs text-gray-900 md:right-10 md:top-10"
            aria-label={`Live auctions: ${auctions.length} items`}
          >
            Live Auctions
            <span className="h-1 w-1 rounded-full bg-purple-600" aria-hidden="true" />
            {auctions.length} items
          </div>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl pr-36 sm:pr-40">
              <h1 className="text-4xl font-bold tracking-tight !text-white md:text-5xl">
                BidSphere
              </h1>
              <p className="mt-3 !text-white/90">
                Browse active auctions, place bids, and follow the market in real-time.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/auctions/browse"
                  search={DEFAULT_BROWSE_SEARCH}
                  className="rounded bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Browse auctions
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

      {categories.length > 0 ? (
        <section aria-label="Popular categories">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Popular categories
            </h2>
            <Link
              to="/"
              search={{ category: undefined }}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View all
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {categories.map((cat: any, i: number) => (
              <Link
                key={cat.id}
                to="/"
                search={{ category: cat.slug }}
                className={`flex min-h-[100px] flex-col justify-between rounded-lg p-4 transition hover:opacity-90 ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`}
              >
                <span className="font-semibold text-gray-900 dark:text-white">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {error ? (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {auctions.length === 0 ? (
        <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
          {category
            ? `No auctions found in ${activeCategory?.name ?? category}.`
            : 'No auctions found.'}
        </div>
      ) : (
        <>
          {category && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing auctions in{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {activeCategory?.name ?? category}
              </span>
              <Link to="/" search={{ category: undefined }} className="ml-2 text-blue-600 hover:underline dark:text-blue-400">
                Clear filter
              </Link>
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {auctions.map((a: any) => (
              <AuctionCard key={a.id} auction={a} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

