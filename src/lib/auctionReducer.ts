import type { AuctionUiState, AuctionWsEvent } from './types'

export function applyAuctionWsEvent(state: AuctionUiState, event: AuctionWsEvent): AuctionUiState {
  switch (event.type) {
    case 'auction_started': {
      const startTimeMs = event.start_time ? Date.parse(event.start_time) : null
      const endTimeMs = event.end_time ? Date.parse(event.end_time) : null

      return {
        ...state,
        status: event.status ?? 'active',
        startTimeMs: Number.isNaN(startTimeMs ?? NaN) ? null : startTimeMs,
        endTimeMs: Number.isNaN(endTimeMs ?? NaN) ? null : endTimeMs,
        currentPrice: event.current_price ?? state.currentPrice,
        // serverTimeOffsetMs is computed by caller at receive time, not here
      }
    }
    case 'auction_ended': {
      return {
        ...state,
        status: 'ended',
        // keep times as-is
      }
    }
    case 'bid_update': {
      return {
        ...state,
        status: state.status === 'active' ? state.status : state.status,
        currentPrice: event.current_price,
        bids: [event.bid, ...state.bids].slice(0, 10),
      }
    }
    default: {
      return state
    }
  }
}

