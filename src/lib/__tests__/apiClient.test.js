import { buildAuthHeaders, apiRequest, userFacingApiErrorMessage } from '../apiClient'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const BANNED_MESSAGE =
  'This user account has been banned by an administrator.'

/** Minimal localStorage for apiClient token reads/writes in Node. */
function attachLocalStorage() {
  const map = new Map()
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      map.set(k, String(v))
    },
    removeItem: (k) => {
      map.delete(k)
    },
    clear: () => map.clear(),
    key: () => null,
    get length() {
      return map.size
    },
  }
  return map
}

function okJsonResponse(data) {
  return {
    ok: true,
    status: 200,
    text: async () => '',
    json: async () => data,
  }
}

function errResponse(status, textBody) {
  return {
    ok: false,
    status,
    text: async () => textBody,
    json: async () => JSON.parse(textBody),
  }
}

describe('apiClient', () => {
  let storageMap

  beforeEach(() => {
    storageMap = attachLocalStorage()
    vi.stubGlobal(
      'window',
      Object.assign(globalThis.window || {}, { dispatchEvent: vi.fn() }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('buildAuthHeaders returns Authorization header when token is provided', () => {
    expect(buildAuthHeaders('t123')).toEqual({ Authorization: 'Bearer t123' })
    expect(buildAuthHeaders(null)).toEqual({})
    expect(buildAuthHeaders(undefined)).toEqual({})
  })

  describe('userFacingApiErrorMessage', () => {
    it('returns banned copy for user_inactive code', () => {
      expect(
        userFacingApiErrorMessage(403, JSON.stringify({ code: 'user_inactive' })),
      ).toBe(BANNED_MESSAGE)
    })

    it('returns banned copy for 401 with inactive detail string', () => {
      expect(
        userFacingApiErrorMessage(401, JSON.stringify({ detail: 'User is inactive' })),
      ).toBe(BANNED_MESSAGE)
    })

    it('returns null for unknown JSON', () => {
      expect(userFacingApiErrorMessage(400, JSON.stringify({ foo: 'bar' }))).toBeNull()
    })

    it('returns null for non-JSON body', () => {
      expect(userFacingApiErrorMessage(500, 'plain text')).toBeNull()
    })
  })

  it('apiRequest attaches Authorization header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      okJsonResponse({ hello: 'world' }),
    )
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

  it('apiRequest refreshes expired access token then retries GET with new Bearer', async () => {
    const expiredBody = JSON.stringify({
      code: 'token_not_valid',
      detail: 'Token is expired',
    })

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(errResponse(401, expiredBody))
      .mockResolvedValueOnce(
        okJsonResponse({ access: 'new-access', refresh: 'new-refresh' }),
      )
      .mockResolvedValueOnce(okJsonResponse({ data: 'ok' }))

    globalThis.fetch = fetchMock

    const result = await apiRequest({
      method: 'GET',
      path: '/auctions/',
      token: 'old-access',
      refreshToken: 'refresh-token',
    })

    expect(result).toEqual({ data: 'ok' })
    expect(fetchMock).toHaveBeenCalledTimes(3)

    expect(fetchMock.mock.calls[0][0]).toContain('/api/auctions/')
    expect(fetchMock.mock.calls[1][0]).toContain('/api/auth/refresh/')
    expect(fetchMock.mock.calls[1][1].method).toBe('POST')
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer new-access')

    expect(storageMap.get('auth.access_token')).toBe('new-access')
    expect(storageMap.get('auth.refresh_token')).toBe('new-refresh')
  })

  it('apiRequest uses refresh token from localStorage when not passed in options', async () => {
    storageMap.set('auth.refresh_token', 'stored-refresh')
    storageMap.set('auth.access_token', 'stored-access')

    const expiredBody = JSON.stringify({
      code: 'token_not_valid',
      detail: 'token is expired',
    })

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(errResponse(401, expiredBody))
      .mockResolvedValueOnce(okJsonResponse({ access: 'from-storage-flow' }))
      .mockResolvedValueOnce(okJsonResponse({ ok: true }))

    globalThis.fetch = fetchMock

    await apiRequest({
      method: 'GET',
      path: '/auth/me/',
    })

    const refreshCall = fetchMock.mock.calls[1]
    expect(refreshCall[0]).toContain('/api/auth/refresh/')
    expect(JSON.parse(refreshCall[1].body)).toEqual({ refresh: 'stored-refresh' })
  })

  it('apiRequest throws when access expired and no refresh token available', async () => {
    const expiredBody = JSON.stringify({
      code: 'token_not_valid',
      detail: 'Token is expired',
    })
    const fetchMock = vi.fn().mockResolvedValueOnce(errResponse(401, expiredBody))
    globalThis.fetch = fetchMock

    await expect(
      apiRequest({
        method: 'GET',
        path: '/auctions/',
        token: 'only-access',
      }),
    ).rejects.toThrow(/API error 401/)

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('apiRequest clears stored tokens when refresh fails', async () => {
    storageMap.set('auth.refresh_token', 'bad-refresh')
    storageMap.set('auth.access_token', 'old')

    const expiredBody = JSON.stringify({
      code: 'token_not_valid',
      detail: 'Token is expired',
    })
    const refreshFail = JSON.stringify({ detail: 'Invalid refresh' })

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(errResponse(401, expiredBody))
      .mockResolvedValueOnce(errResponse(401, refreshFail))

    globalThis.fetch = fetchMock

    await expect(
      apiRequest({
        method: 'GET',
        path: '/auctions/',
        token: 'old',
      }),
    ).rejects.toThrow()

    expect(storageMap.has('auth.access_token')).toBe(false)
    expect(storageMap.has('auth.refresh_token')).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('apiRequest does not retry twice when retry still returns error', async () => {
    const expiredBody = JSON.stringify({
      code: 'token_not_valid',
      detail: 'Token is expired',
    })
    const stillBad = JSON.stringify({ detail: 'Forbidden' })

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(errResponse(401, expiredBody))
      .mockResolvedValueOnce(okJsonResponse({ access: 'new-access' }))
      .mockResolvedValueOnce(errResponse(403, stillBad))

    globalThis.fetch = fetchMock

    await expect(
      apiRequest({
        method: 'GET',
        path: '/auctions/',
        token: 'old',
        refreshToken: 'r',
      }),
    ).rejects.toThrow(/API error 403/)

    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('apiRequest throws friendly message for banned user payload on error', async () => {
    const body = JSON.stringify({ code: 'user_inactive' })
    const fetchMock = vi.fn().mockResolvedValueOnce(errResponse(403, body))
    globalThis.fetch = fetchMock

    await expect(
      apiRequest({ method: 'GET', path: '/auth/me/', token: 't' }),
    ).rejects.toThrow(BANNED_MESSAGE)
  })
})
