import { computeRemainingMs, computeServerTimeOffsetMs } from '../timeSync.js'

describe('timeSync', () => {
  it('computes server offset and remaining time correctly', () => {
    const localReceiveMs = 1_000_000
    const offsetMs = 5_000
    const serverStartIso = new Date(localReceiveMs + offsetMs).toISOString()

    const computedOffset = computeServerTimeOffsetMs({
      serverStartTimeIso: serverStartIso,
      localReceiveTimestampMs: localReceiveMs,
    })
    expect(computedOffset).toBe(offsetMs)

    const localNowMs = 1_000_200
    const remainingMsExpected = 2_500
    const serverEndIso = new Date(
      localNowMs + offsetMs + remainingMsExpected,
    ).toISOString()

    const remainingMs = computeRemainingMs({
      serverEndTimeIso: serverEndIso,
      localNowTimestampMs: localNowMs,
      serverTimeOffsetMs: computedOffset,
    })

    expect(remainingMs).toBe(remainingMsExpected)
  })
})

