import React, { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useAuth } from '../app/auth/AuthContext'
import { auctionDetailRoute } from '../app/router'
import {
  addToWatchlist,
  getAuction,
  getMe,
  placeBid,
  removeFromWatchlist,
  startAuction,
} from '../app/api/rest'
import { getWsBaseUrl, resolveMediaUrl } from '../lib/env'
import { computeServerTimeOffsetMs } from '../lib/timeSync'

type WsBidUpdateEvent = {
  type: 'bid_update'
  bid: any
  current_price: string
}

type WsAuctionStartedEvent = {
  type: 'auction_started'
  auction_id: string
  status?: string
  start_time?: string | null
  end_time?: string | null
  current_price?: string | null
}

type WsAuctionEndedEvent = {
  type: 'auction_ended'
  auction_id: string
  status: 'ended'
}

type WsViewerCountUpdateEvent = {
  type: 'viewer_count_update'
  viewer_count: number
}

type WsEvent =
  | WsBidUpdateEvent
  | WsAuctionStartedEvent
  | WsAuctionEndedEvent
  | WsViewerCountUpdateEvent

function formatMs(ms: number) {
  const clamped = Math.max(0, ms)
  const totalSeconds = Math.floor(clamped / 1000)
  const d = Math.floor(totalSeconds / (24 * 3600))
  const h = Math.floor((totalSeconds % (24 * 3600)) / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (d > 0) return `${d}d ${h}h ${m}m ${s}s`
  if (h > 0) return `${h}h ${m}m ${s}s`
  return `${m}m ${s}s`
}

function formatPrice(value: string | number | null | undefined): string {
  if (value == null || value === '') return '—'
  const n = typeof value === 'string' ? parseFloat(value) : value
  if (Number.isNaN(n)) return String(value)
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function AuctionDetailPage() {
  const { accessToken } = useAuth()
  const { auctionId } = auctionDetailRoute.useParams()

  const [auction, setAuction] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [serverOffsetMs, setServerOffsetMs] = useState<number | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 500)
    return () => window.clearInterval(id)
  }, [])

  // Bid UI
  const [bidAmount, setBidAmount] = useState('')
  const [bidBusy, setBidBusy] = useState(false)
  const [watched, setWatched] = useState(false)
  const [viewerCount, setViewerCount] = useState<number | null>(null)

  // Start UI
  const [startTime, setStartTime] = useState('')
  const [durationDays, setDurationDays] = useState(0)
  const [durationHours, setDurationHours] = useState(0)
  const [durationMinutes, setDurationMinutes] = useState(0)
  const [startError, setStartError] = useState<string | null>(null)
  const [startBusy, setStartBusy] = useState(false)
  const [meUserId, setMeUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken) {
      setMeUserId(null)
      return
    }
    let mounted = true
    ;(async () => {
      try {
        const me = await getMe(accessToken)
        if (mounted && me?.id != null) setMeUserId(String(me.id))
      } catch {
        if (mounted) setMeUserId(null)
      }
    })()
    return () => {
      mounted = false
    }
  }, [accessToken])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setError(null)
      try {
        const res = await getAuction(accessToken, auctionId)
        if (!mounted) return
        setAuction(res)
        setServerOffsetMs(null)
        if (res?.is_watched != null) setWatched(!!res.is_watched)
      } catch (e: any) {
        if (mounted) setError(e?.message ?? 'Failed to load auction')
      }
    })()
    return () => {
      mounted = false
    }
  }, [accessToken, auctionId])

  useEffect(() => {
    wsRef.current?.close()
    setViewerCount(null)

    const wsBase = getWsBaseUrl()
    const ws = new WebSocket(`${wsBase}/ws/auctions/${auctionId}/`)
    wsRef.current = ws

    ws.onmessage = (msg) => {
      try {
        const event: WsEvent = JSON.parse(msg.data)

        if (event.type === 'viewer_count_update') {
          setViewerCount(event.viewer_count)
          return
        }

        if (event.type === 'auction_started') {
          if (event.start_time) {
            const offset = computeServerTimeOffsetMs({
              serverStartTimeIso: event.start_time,
              localReceiveTimestampMs: Date.now(),
            })
            setServerOffsetMs(offset)
          }
          // Replace with full API payload so status, prices, and bids stay in sync with server.
          void getAuction(accessToken, auctionId)
            .then((res) => {
              setAuction(res)
            })
            .catch(() => {
              setAuction((prev: any) => {
                if (!prev) return prev
                return {
                  ...prev,
                  status: event.status ?? 'active',
                  start_time: event.start_time ?? prev.start_time,
                  end_time: event.end_time ?? prev.end_time,
                  current_price: event.current_price ?? prev.current_price,
                }
              })
            })
          return
        }

        if (event.type === 'bid_update') {
          setAuction((prev: any) => {
            if (!prev) return prev
            return {
              ...prev,
              current_price: event.current_price,
              bids: [event.bid, ...(prev.bids ?? [])].slice(0, 10),
            }
          })
          return
        }

        if (event.type === 'auction_ended') {
          void getAuction(accessToken, auctionId)
            .then((res) => setAuction(res))
            .catch(() => {
              setAuction((prev: any) => {
                if (!prev) return prev
                return { ...prev, status: 'ended' }
              })
            })
        }
      } catch {
        // ignore malformed WS messages
      }
    }

    return () => {
      ws.close()
    }
  }, [auctionId, accessToken])

  /** Align with server clock when we have a WS-derived offset (bid/start events). */
  const effectiveNowMs =
    serverOffsetMs === null ? nowMs : nowMs + serverOffsetMs

  /**
   * Scheduled (before start): countdown to start_time.
   * Active (or scheduled past start until backend flips): countdown to end_time (auction duration).
   */
  const countdown = (() => {
    if (!auction) return null
    const status = auction.status as string
    if (status === 'ended' || status === 'cancelled') {
      return { label: status === 'ended' ? 'Auction ended' : 'Cancelled', ms: null as number | null }
    }

    const startMs = auction.start_time ? Date.parse(auction.start_time) : NaN
    const endMs = auction.end_time ? Date.parse(auction.end_time) : NaN

    if (status === 'scheduled' && Number.isFinite(startMs)) {
      if (effectiveNowMs < startMs) {
        return { label: 'Starts in', ms: startMs - effectiveNowMs }
      }
      // Start time passed but status still "scheduled" (short lag) — show time left in the window.
      if (Number.isFinite(endMs)) {
        return { label: 'Time left', ms: endMs - effectiveNowMs }
      }
    }

    if (status === 'active' && Number.isFinite(endMs)) {
      return { label: 'Time left', ms: endMs - effectiveNowMs }
    }

    // Fallback: any status with end_time (e.g. edge cases)
    if (Number.isFinite(endMs) && (status === 'scheduled' || status === 'active')) {
      return { label: 'Time left', ms: endMs - effectiveNowMs }
    }

    return null
  })()

  const canBid = auction?.status === 'active'

  async function onSubmitBid(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken || !canBid) return
    if (!bidAmount.trim()) return
    setBidBusy(true)
    setError(null)
    try {
      await placeBid(accessToken, auctionId, bidAmount.trim())
      setBidAmount('')
    } catch (err: any) {
      setError(err?.message ?? 'Bid failed')
    } finally {
      setBidBusy(false)
    }
  }

  async function onStartAuction(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken) return
    setStartError(null)

    if (!durationDays && !durationHours && !durationMinutes) {
      setStartError('Provide at least one duration field.')
      return
    }

    setStartBusy(true)
    try {
      const datetimeLocalToIso = (value: string) => {
        const v = value.trim()
        if (!v) return null
        const d = new Date(v)
        if (Number.isNaN(d.getTime())) return null
        // backend expects ISO8601; datetime-local is interpreted as local time by Date().
        return d.toISOString()
      }

      const payload: any = {
        duration_days: durationDays,
        duration_hours: durationHours,
        duration_minutes: durationMinutes,
      }
      const isoStartTime = datetimeLocalToIso(startTime)
      if (isoStartTime) payload.start_time = isoStartTime
      const res = await startAuction(accessToken, auctionId, payload)
      setAuction(res)
      setServerOffsetMs(null)
    } catch (err: any) {
      setStartError(err?.message ?? 'Failed to start auction')
    } finally {
      setStartBusy(false)
    }
  }

  if (!auction) return <div className="text-sm text-gray-600">Loading...</div>

  const itemImages = auction.item?.images ?? []
  const primaryImage = itemImages[0]
  const isActive = auction.status === 'active'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{auction.item?.title}</h1>
          {isActive && (
            <span
              className="inline-flex items-center gap-2 rounded-md bg-red-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white"
              aria-label={`Live auction, ${viewerCount ?? 0} watching`}
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              <span>LIVE</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 shrink-0 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
              </svg>
              <span className="tabular-nums">{viewerCount ?? 0}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {accessToken ? (
            <button
              type="button"
              title={watched ? 'Remove from watchlist' : 'Add to watchlist'}
              aria-label={watched ? 'Remove from watchlist' : 'Add to watchlist'}
              className="rounded border border-gray-300 p-2 text-red-600 transition-colors hover:bg-red-50 dark:border-gray-700 dark:text-red-400 dark:hover:bg-red-950/30"
              onClick={async () => {
                if (!accessToken) return
                try {
                  if (watched) await removeFromWatchlist(accessToken, auctionId)
                  else await addToWatchlist(accessToken, auctionId)
                  setWatched((w) => !w)
                } catch (e: any) {
                  setError(e?.message ?? 'Watchlist failed')
                }
              }}
            >
              {watched ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2" aria-hidden>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              )}
            </button>
          ) : (
            <Link
              to="/auth/login"
              className="text-sm text-purple-700 hover:underline"
            >
              Login to bid
            </Link>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {auction.status === 'ended' ? (
        (() => {
          const winner = auction.winner as { id?: string; username?: string; first_name?: string } | null
          const hammer = formatPrice(auction.winning_price ?? auction.current_price)
          const winnerLabel = winner
            ? (winner.first_name?.trim() || winner.username || 'Bidder')
            : ''
          const iAmWinner = Boolean(
            winner && meUserId && String(winner.id) === String(meUserId),
          )

          if (winner && iAmWinner) {
            return (
              <section
                className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/40"
                aria-live="polite"
              >
                <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">You won!</h2>
                <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-200">
                  <span className="font-medium">{auction.item?.title}</span> —{' '}
                  <span className="font-semibold">{hammer}</span>
                </p>
                <p className="mt-1 text-xs text-emerald-800/90 dark:text-emerald-300/90">
                  You had the highest bid.
                </p>
              </section>
            )
          }

          if (winner && auction.is_seller) {
            return (
              <section
                className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50"
                aria-live="polite"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Auction ended</h2>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                  Sold to <span className="font-medium">{winnerLabel}</span> for{' '}
                  <span className="font-semibold">{hammer}</span>.
                </p>
              </section>
            )
          }

          if (winner) {
            return (
              <section
                className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50"
                aria-live="polite"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Auction ended</h2>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                  Winner: <span className="font-medium">{winnerLabel}</span>
                </p>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                  Final price: <span className="font-semibold">{hammer}</span>
                </p>
              </section>
            )
          }

          return (
            <section
              className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50"
              aria-live="polite"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Auction ended</h2>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                No bids were placed on this auction.
              </p>
            </section>
          )
        })()
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Left: Item image and description */}
        <div className="space-y-4">
          {primaryImage?.image_url ? (
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
              <img
                src={resolveMediaUrl(primaryImage.image_url) ?? primaryImage.image_url}
                alt={primaryImage.alt_text || auction.item?.title || 'Item'}
                className="h-auto w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
              No image
            </div>
          )}
          {auction.item?.description ? (
            <section className="rounded border border-gray-200 p-4 dark:border-gray-800">
              <h2 className="mb-2 text-lg font-semibold">Description</h2>
              <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                {auction.item.description}
              </p>
            </section>
          ) : null}
        </div>

        {/* Right: Auction info and Bidding */}
        <div className="space-y-4">
          <section className="space-y-3 rounded border border-gray-200 p-4 dark:border-gray-800">
            <h2 className="text-lg font-semibold">Auction</h2>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Start:{' '}
              {auction.start_time
                ? new Date(auction.start_time).toLocaleString()
                : '—'}
              <br />
              End:{' '}
              {auction.end_time
                ? new Date(auction.end_time).toLocaleString()
                : '—'}
            </div>
            {countdown ? (
              <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                {countdown.ms === null ? (
                  <span>{countdown.label}</span>
                ) : countdown.ms <= 0 ? (
                  <span>
                    {auction.status === 'scheduled' ? 'Starting…' : 'Ended'}
                  </span>
                ) : (
                  <span>
                    {countdown.label}: {formatMs(countdown.ms)}
                  </span>
                )}
              </div>
            ) : null}
          </section>

          <section className="space-y-4 rounded border border-gray-200 p-4 dark:border-gray-800">
            <h2 className="text-lg font-semibold">Bidding</h2>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Starting: {formatPrice(auction.starting_price)}
              <br />
              Current: <span className="font-semibold">{formatPrice(auction.current_price)}</span>
            </div>

            {canBid ? (
              <form onSubmit={onSubmitBid} className="flex gap-2">
                <input
                  className="w-32 rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="Amount"
                  inputMode="decimal"
                />
                <button
                  type="submit"
                  disabled={bidBusy}
                  className="rounded bg-purple-600 px-4 py-2 text-white disabled:opacity-50"
                >
                  Place bid
                </button>
              </form>
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Bidding is available only when status is <span className="font-semibold">active</span>.
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Recent bids</h3>
              <div className="max-h-56 overflow-auto rounded border border-gray-200 dark:border-gray-800">
                {(auction.bids ?? []).length ? (
                  <ul className="divide-y divide-gray-200 text-sm dark:divide-gray-800">
                    {(auction.bids ?? []).map((b: any) => (
                      <li key={b.id} className="flex items-center justify-between p-2">
                        <span>
                          {b.bidder?.username ?? 'user'}: {formatPrice(b.amount)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {b.created_at ? new Date(b.created_at).toLocaleTimeString() : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-3 text-sm text-gray-600 dark:text-gray-400">
                    No bids yet.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {auction.status === 'draft' && auction.is_seller ? (
        <section className="space-y-3 rounded border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold">Start / Schedule Auction</h2>
          {startError ? (
            <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200">
              {startError}
            </div>
          ) : null}

          <form onSubmit={onStartAuction} className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 min-w-0">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                start_time (optional)
              </span>
              <input
                className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="YYYY-MM-DDThh:mm"
              />
            </label>

            <div className="grid min-w-0 gap-3 sm:grid-cols-3 sm:items-end">
              <label className="grid min-w-0 gap-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  days
                </span>
                <input
                  type="number"
                  min={0}
                  className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                />
              </label>
              <label className="grid min-w-0 gap-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  hours
                </span>
                <input
                  type="number"
                  min={0}
                  className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                />
              </label>
              <label className="grid min-w-0 gap-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  minutes
                </span>
                <input
                  type="number"
                  min={0}
                  className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                />
              </label>
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={startBusy}
                className="rounded bg-purple-600 px-4 py-2 text-white disabled:opacity-50"
              >
                {startBusy ? 'Starting...' : 'Start auction'}
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  )
}

