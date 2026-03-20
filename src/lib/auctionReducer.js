export function applyAuctionWsEvent(state, event) {
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
      }
    }
    case 'auction_ended': {
      return {
        ...state,
        status: 'ended',
      }
    }
    case 'bid_update': {
      return {
        ...state,
        currentPrice: event.current_price,
        bids: [event.bid, ...state.bids].slice(0, 10),
      }
    }
    default:
      return state
  }
}

