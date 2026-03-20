import { buildStartAuctionPayload } from '../startAuctionPayload.js'

describe('startAuctionPayload', () => {
  it('throws when no duration fields are provided', () => {
    expect(() =>
      buildStartAuctionPayload({
        durationDays: 0,
        durationHours: 0,
        durationMinutes: 0,
        startTime: '',
      }),
    ).toThrow('Provide at least one duration field')
  })

  it('includes only non-empty start_time', () => {
    const payload = buildStartAuctionPayload({
      durationDays: 1,
      durationHours: 0,
      durationMinutes: 0,
      startTime: '2026-03-10T20:00:00Z',
    })

    expect(payload.duration_days).toBe(1)
    expect(payload.start_time).toBe('2026-03-10T20:00:00Z')
  })
})

