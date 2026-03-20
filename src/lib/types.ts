export type AuctionStatus = 'draft' | 'scheduled' | 'active' | 'ended' | 'cancelled'

export type WebSocketAuctionStartedEvent = {
  type: 'auction_started'
  auction_id: string
  status?: AuctionStatus
  start_time?: string | null
  end_time?: string | null
  current_price?: string | null
}

export type WebSocketAuctionEndedEvent = {
  type: 'auction_ended'
  auction_id: string
  status: 'ended'
}

export type WebSocketBidUpdateEvent = {
  type: 'bid_update'
  bid: {
    id: string
    amount: string
    bidder: { id: string; username: string }
    created_at: string
  }
  current_price: string
}

export type AuctionWsEvent = WebSocketAuctionStartedEvent | WebSocketAuctionEndedEvent | WebSocketBidUpdateEvent

export type AuctionUiState = {
  auctionId: string
  status: AuctionStatus
  startTimeMs: number | null
  endTimeMs: number | null
  currentPrice: string | null
  bids: Array<WebSocketBidUpdateEvent['bid']>
  serverTimeOffsetMs: number | null
}

