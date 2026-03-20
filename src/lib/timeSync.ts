/**
 * Server time synchronization helpers.
 *
 * Backend is source of truth for `start_time`/`end_time`.
 * When we receive `auction_started`, we compute an offset so countdowns
 * stay stable even if the user's clock is off.
 */

export function computeServerTimeOffsetMs(params: {
  serverStartTimeIso: string
  localReceiveTimestampMs: number
}): number {
  const serverStartMs = Date.parse(params.serverStartTimeIso)
  if (Number.isNaN(serverStartMs)) {
    throw new Error('Invalid serverStartTimeIso')
  }
  return serverStartMs - params.localReceiveTimestampMs
}

export function computeRemainingMs(params: {
  serverEndTimeIso: string
  localNowTimestampMs: number
  serverTimeOffsetMs: number
}): number {
  const serverEndMs = Date.parse(params.serverEndTimeIso)
  if (Number.isNaN(serverEndMs)) {
    throw new Error('Invalid serverEndTimeIso')
  }
  // "serverNow" = localNow + offset
  const serverNowMs = params.localNowTimestampMs + params.serverTimeOffsetMs
  return serverEndMs - serverNowMs
}

