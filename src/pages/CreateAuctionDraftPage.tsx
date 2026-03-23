import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '../app/auth/AuthContext'
import { createAuctionDraft, listMyItems } from '../app/api/rest'

export function CreateAuctionDraftPage() {
  const { accessToken } = useAuth()
  const navigate = useNavigate()

  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [itemId, setItemId] = useState('')
  const [startingPrice, setStartingPrice] = useState('100.00')
  const [reservePrice, setReservePrice] = useState('')

  useEffect(() => {
    if (!accessToken) {
      navigate({ to: '/auth/login' })
      return
    }
    let mounted = true
    ;(async () => {
      setError(null)
      setLoading(true)
      try {
        const res = await listMyItems(accessToken)
        if (!mounted) return
        const list = res?.results ?? (Array.isArray(res) ? res : [])
        setItems(list)
      } catch (e: any) {
        if (mounted) setError(e?.message ?? 'Failed to load items')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [accessToken, navigate])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken || !itemId.trim()) return
    setBusy(true)
    setError(null)
    try {
      const payload: Record<string, string> = {
        item_id: itemId,
        starting_price: startingPrice.trim(),
      }
      if (reservePrice.trim()) payload.reserve_price = reservePrice.trim()
      const created = await createAuctionDraft(accessToken, payload)
      navigate({ to: '/auctions/$auctionId', params: { auctionId: created.id } })
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create draft auction')
    } finally {
      setBusy(false)
    }
  }

  if (!accessToken) {
    return (
      <div className="text-sm text-gray-600 dark:text-gray-400">Redirecting to login…</div>
    )
  }

  if (loading) {
    return <div className="text-sm text-gray-600 dark:text-gray-400">Loading your items…</div>
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Create draft auction</h1>
        <Link
          to="/items"
          className="text-sm text-purple-700 hover:underline dark:text-purple-300"
        >
          Back to items
        </Link>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Choose one of your items, set a starting price (and optional reserve), then create a draft.
        You can schedule or start the auction from the auction page.
      </p>

      {error ? (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            You don&apos;t have any items yet. Create an item first, then return here to list it for auction.
          </p>
          <Link
            to="/items/new"
            className="mt-3 inline-block rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            Create item
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4 rounded border border-gray-200 p-4 dark:border-gray-800">
          <label className="grid gap-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Item</span>
            <select
              required
              className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
            >
              <option value="">Select an item…</option>
              {items.map((it: any) => (
                <option key={it.id} value={it.id}>
                  {it.title}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-sm text-gray-700 dark:text-gray-300">Starting price</span>
              <input
                className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
                type="text"
                inputMode="decimal"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm text-gray-700 dark:text-gray-300">Reserve price (optional)</span>
              <input
                className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                value={reservePrice}
                onChange={(e) => setReservePrice(e.target.value)}
                type="text"
                inputMode="decimal"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={busy || !itemId}
            className="rounded bg-purple-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {busy ? 'Creating…' : 'Create draft auction'}
          </button>
        </form>
      )}
    </div>
  )
}
