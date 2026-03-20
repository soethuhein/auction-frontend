import { applyAuctionWsEvent } from '../auctionReducer.js'

const baseState = {
  auctionId: 'auction-1',
  status: 'scheduled',
  startTimeMs: null,
  endTimeMs: null,
  currentPrice: null,
  bids: [],
  serverTimeOffsetMs: null,
}

describe('auctionReducer', () => {
  it('applies auction_started and updates times + price', () => {
    const start = new Date('2026-03-10T20:00:00Z').toISOString()
    const end = new Date('2026-03-10T22:00:00Z').toISOString()

    const event = {
      type: 'auction_started',
      auction_id: 'auction-1',
      status: 'active',
      start_time: start,
      end_time: end,
      current_price: '100.00',
    }

    const next = applyAuctionWsEvent(baseState, event)
    expect(next.status).toBe('active')
    expect(next.startTimeMs).toBe(Date.parse(start))
    expect(next.endTimeMs).toBe(Date.parse(end))
    expect(next.currentPrice).toBe('100.00')
  })

  it('applies bid_update and prepends bid', () => {
    const started = {
      type: 'auction_started',
      auction_id: 'auction-1',
      status: 'active',
      start_time: new Date('2026-03-10T20:00:00Z').toISOString(),
      end_time: new Date('2026-03-10T22:00:00Z').toISOString(),
      current_price: '100.00',
    }

    const afterStarted = applyAuctionWsEvent(baseState, started)

    const bidEvent = {
      type: 'bid_update',
      current_price: '130.00',
      bid: {
        id: 'bid-1',
        amount: '130.00',
        bidder: { id: 'u-2', username: 'bidder' },
        created_at: new Date('2026-03-10T20:10:00Z').toISOString(),
      },
    }

    const next = applyAuctionWsEvent(afterStarted, bidEvent)
    expect(next.currentPrice).toBe('130.00')
    expect(next.bids[0].id).toBe('bid-1')
    expect(next.bids[0].amount).toBe('130.00')
  })

  it('applies auction_ended and sets ended status', () => {
    const ended = {
      type: 'auction_ended',
      auction_id: 'auction-1',
      status: 'ended',
    }

    const next = applyAuctionWsEvent(baseState, ended)
    expect(next.status).toBe('ended')
  })
})

