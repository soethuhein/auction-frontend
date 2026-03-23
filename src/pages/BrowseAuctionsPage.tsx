import { useEffect, useMemo, useState } from 'react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { DEFAULT_BROWSE_SEARCH } from '../app/browseSearchDefaults'
import { listAuctions, listCategories } from '../app/api/rest'
import { AuctionCard } from '../components/AuctionCard'

const browseRouteApi = getRouteApi('/auctions/browse')

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active', label: 'Active' },
  { value: 'cancelled', label: 'Cancelled' },
]

const ORDERING_OPTIONS = [
  { value: '-created_at', label: 'Newest first' },
  { value: 'created_at', label: 'Oldest first' },
  { value: 'end_time', label: 'Ending soon' },
  { value: '-end_time', label: 'Ending last' },
  { value: 'current_price', label: 'Price: low to high' },
  { value: '-current_price', label: 'Price: high to low' },
]

export function BrowseAuctionsPage() {
  const navigate = useNavigate({ from: '/auctions/browse' })
  const searchState = browseRouteApi.useSearch()
  const page = searchState.page

  const [data, setData] = useState<any | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Draft form (Apply updates URL)
  const [q, setQ] = useState(searchState.q ?? '')
  const [category, setCategory] = useState(searchState.category ?? '')
  const [status, setStatus] = useState(searchState.status ?? '')
  const [endAfter, setEndAfter] = useState(searchState.end_after ?? '')
  const [endBefore, setEndBefore] = useState(searchState.end_before ?? '')
  const [ordering, setOrdering] = useState(searchState.ordering ?? '-created_at')

  useEffect(() => {
    setQ(searchState.q ?? '')
    setCategory(searchState.category ?? '')
    setStatus(searchState.status ?? '')
    setEndAfter(searchState.end_after ?? '')
    setEndBefore(searchState.end_before ?? '')
    setOrdering(searchState.ordering ?? '-created_at')
  }, [searchState])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const list = await listCategories()
        if (mounted) setCategories(list)
      } catch {
        /* optional */
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const apiParams = useMemo(
    () => ({
      search: searchState.q,
      category: searchState.category || undefined,
      status: searchState.status || undefined,
      end_after: searchState.end_after || undefined,
      end_before: searchState.end_before || undefined,
      ordering: searchState.ordering || '-created_at',
      page,
    }),
    [searchState, page]
  )

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const res = await listAuctions({
          search: apiParams.search,
          category: apiParams.category,
          status: apiParams.status,
          exclude_status: apiParams.status ? undefined : 'ended',
          end_after: apiParams.end_after,
          end_before: apiParams.end_before,
          ordering: apiParams.ordering,
          page: apiParams.page,
        })
        if (mounted) setData(res)
      } catch (e: any) {
        if (mounted) setError(e?.message ?? 'Failed to load auctions')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [apiParams])

  const auctions = data?.results ?? []
  const totalCount = typeof data?.count === 'number' ? data.count : auctions.length
  const pageSize = 20
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  function applyFilters(e?: React.FormEvent) {
    e?.preventDefault()
    navigate({
      to: '/auctions/browse',
      search: {
        q: q.trim() || undefined,
        category: category || undefined,
        status: status || undefined,
        end_after: endAfter || undefined,
        end_before: endBefore || undefined,
        ordering: ordering || '-created_at',
        page: 1,
      },
    })
  }

  function clearFilters() {
    setQ('')
    setCategory('')
    setStatus('')
    setEndAfter('')
    setEndBefore('')
    setOrdering('-created_at')
    navigate({
      to: '/auctions/browse',
      search: {
        ...DEFAULT_BROWSE_SEARCH,
        ordering: undefined,
      },
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold !text-gray-900 dark:!text-white">Browse auctions</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Search and filter all listings, then open an auction to place a bid.
        </p>
      </div>

      <form
        onSubmit={applyFilters}
        className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-900/50"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="grid gap-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Search</span>
            <input
              type="search"
              placeholder="Item title or description"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</span>
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c: any) => (
                <option key={c.id} value={String(c.slug)}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ends after</span>
            <input
              type="date"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950"
              value={endAfter}
              onChange={(e) => setEndAfter(e.target.value)}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ends before</span>
            <input
              type="date"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950"
              value={endBefore}
              onChange={(e) => setEndBefore(e.target.value)}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort</span>
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950"
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
            >
              {ORDERING_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Apply filters
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Clear
          </button>
        </div>
      </form>

      {error ? (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600 dark:text-gray-400">
        <span>
          {loading ? 'Loading…' : `${totalCount} auction${totalCount === 1 ? '' : 's'} found`}
        </span>
        {totalPages > 1 ? (
          <div className="flex items-center gap-2">
            <Link
              to="/auctions/browse"
              search={{ ...searchState, page: Math.max(1, page - 1) }}
              className={
                page <= 1
                  ? 'pointer-events-none opacity-40'
                  : 'text-blue-600 hover:underline dark:text-blue-400'
              }
              aria-disabled={page <= 1}
            >
              Previous
            </Link>
            <span>
              Page {page} of {totalPages}
            </span>
            <Link
              to="/auctions/browse"
              search={{ ...searchState, page: Math.min(totalPages, page + 1) }}
              className={
                page >= totalPages
                  ? 'pointer-events-none opacity-40'
                  : 'text-blue-600 hover:underline dark:text-blue-400'
              }
              aria-disabled={page >= totalPages}
            >
              Next
            </Link>
          </div>
        ) : null}
      </div>

      {loading && !data ? (
        <div className="text-sm text-gray-500">Loading auctions…</div>
      ) : auctions.length === 0 ? (
        <div className="rounded border border-gray-200 bg-white p-8 text-center text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
          No auctions match your filters.
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
