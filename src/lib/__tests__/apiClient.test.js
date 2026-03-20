import { buildAuthHeaders, apiRequest } from '../apiClient.js'
import { vi } from 'vitest'

describe('apiClient', () => {
  it('buildAuthHeaders returns Authorization header when token is provided', () => {
    expect(buildAuthHeaders('t123')).toEqual({ Authorization: 'Bearer t123' })
    expect(buildAuthHeaders(null)).toEqual({})
    expect(buildAuthHeaders(undefined)).toEqual({})
  })

  it('apiRequest attaches Authorization header', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ hello: 'world' }),
      text: async () => '',
    })

    globalThis.fetch = fetchMock

    await apiRequest({
      method: 'GET',
      path: '/auctions/',
      token: 't-abc',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const calledOptions = fetchMock.mock.calls[0][1]
    expect(calledOptions.headers.Authorization).toBe('Bearer t-abc')
  })
})

