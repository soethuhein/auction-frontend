/**
 * Build the payload for POST /api/auctions/{id}/start/
 * Backend requirements:
 * - at least one of duration_days/duration_hours/duration_minutes must be non-zero
 * - start_time is optional; if present it must be passed as-is (ISO8601 string)
 */

export function buildStartAuctionPayload(params) {
  const duration_days = Number(params.durationDays ?? 0)
  const duration_hours = Number(params.durationHours ?? 0)
  const duration_minutes = Number(params.durationMinutes ?? 0)

  const hasDuration = Boolean(duration_days || duration_hours || duration_minutes)
  if (!hasDuration) {
    throw new Error('Provide at least one duration field (days/hours/minutes).')
  }

  const payload = {
    duration_days,
    duration_hours,
    duration_minutes,
  }

  if (params.startTime && String(params.startTime).trim()) {
    payload.start_time = String(params.startTime).trim()
  }

  return payload
}

