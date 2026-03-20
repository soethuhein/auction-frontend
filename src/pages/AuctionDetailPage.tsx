import React, { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useAuth } from '../app/auth/AuthContext'
import { auctionDetailRoute } from '../app/router'
import {
  addToWatchlist,
  getAuction,
  placeBid,
  removeFromWatchlist,
  startAuction,
} from '../app/api/rest'
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

type WsEvent = WsBidUpdateEvent | WsAuctionStartedEvent | WsAuctionEndedEvent

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

  // Start UI
  const [startTime, setStartTime] = useState('')
  const [durationDays, setDurationDays] = useState(0)
  const [durationHours, setDurationHours] = useState(0)
  const [durationMinutes, setDurationMinutes] = useState(0)
  const [startError, setStartError] = useState<string | null>(null)
  const [startBusy, setStartBusy] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setError(null)
      try {
        const res = await getAuction(accessToken, auctionId)
        if (!mounted) return
        setAuction(res)
        setServerOffsetMs(null)
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

    // Use 127.0.0.1 to avoid IPv6 localhost (Firefox) connectivity issues.
    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/auctions/${auctionId}/`)
    wsRef.current = ws

    ws.onmessage = (msg) => {
      try {
        const event: WsEvent = JSON.parse(msg.data)

        if (event.type === 'auction_started') {
          if (event.start_time) {
            const offset = computeServerTimeOffsetMs({
              serverStartTimeIso: event.start_time,
              localReceiveTimestampMs: Date.now(),
            })
            setServerOffsetMs(offset)
          }
          setAuction((prev: any) => {
            if (!prev) return prev
            return {
              ...prev,
              status: event.status ?? 'active',
              start_time: event.start_time,
              end_time: event.end_time,
              current_price: event.current_price,
            }
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
          setAuction((prev: any) => {
            if (!prev) return prev
            return { ...prev, status: 'ended' }
          })
        }
      } catch {
        // ignore malformed WS messages
      }
    }

    return () => {
      ws.close()
    }
  }, [auctionId])

  const remainingMs = (() => {
    if (!auction?.end_time) return null
    const endMs = Date.parse(auction.end_time)
    if (serverOffsetMs === null) return endMs - nowMs
    return endMs - (nowMs + serverOffsetMs)
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{auction.item?.title}</h1>
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Status: <span className="font-medium">{auction.status}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {accessToken ? (
            <button
              className="rounded border border-gray-300 px-3 py-1 text-sm dark:border-gray-700"
              type="button"
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
              {watched ? 'Unwatch' : 'Watch'}
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

      <div className="grid gap-4 md:grid-cols-2">
        <section className="space-y-3 rounded border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold">Auction</h2>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Starting: {auction.starting_price} <br />
            Current: <span className="font-semibold">{auction.current_price}</span>
          </div>
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
          {remainingMs !== null ? (
            <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Countdown: {formatMs(remainingMs)}
            </div>
          ) : null}
        </section>

        <section className="space-y-4 rounded border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold">Bidding</h2>

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
                        {b.bidder?.username ?? 'user'}: {b.amount}
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

      {auction.status === 'draft' ? (
        <section className="space-y-3 rounded border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold">Start / Schedule Auction</h2>
          {startError ? (
            <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200">
              {startError}
            </div>
          ) : null}

          <form onSubmit={onStartAuction} className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                start_time (optional)
              </span>
              <input
                className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="YYYY-MM-DDThh:mm"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
              <label className="grid gap-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  days
                </span>
                <input
                  type="number"
                  min={0}
                  className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  hours
                </span>
                <input
                  type="number"
                  min={0}
                  className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  minutes
                </span>
                <input
                  type="number"
                  min={0}
                  className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
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

