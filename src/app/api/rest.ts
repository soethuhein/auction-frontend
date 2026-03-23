import { apiRequest } from '../../lib/apiClient'

export type RegisterPayload = { email: string; password: string; password2?: string; first_name?: string; last_name?: string }
export type LoginPayload = { email: string; password: string }

export async function registerUser(tokenlessPayload: RegisterPayload) {
  return apiRequest<{ message: string; user_id: string } | any>({
    method: 'POST',
    path: '/auth/register/',
    body: tokenlessPayload,
  })
}

export async function loginUser(payload: LoginPayload) {
  return apiRequest<{ access: string; refresh: string }>({
    method: 'POST',
    path: '/auth/login/',
    body: payload,
  })
}

export async function refreshToken(refresh: string) {
  return apiRequest<{ access: string; refresh: string }>({
    method: 'POST',
    path: '/auth/refresh/',
    body: { refresh },
  })
}

export async function getMe(accessToken: string) {
  return apiRequest<any>({
    method: 'GET',
    path: '/auth/me/',
    token: accessToken,
  })
}

export async function listMyAuctions(accessToken: string) {
  return apiRequest<any>({
    method: 'GET',
    path: '/auth/me/auctions/',
    token: accessToken,
  })
}

export async function listMyBids(
  accessToken: string,
  params?: { won?: boolean; page?: number },
) {
  const sp = new URLSearchParams()
  if (params?.won) sp.set('won', 'true')
  if (params?.page != null && params.page > 1) sp.set('page', String(params.page))
  const q = sp.toString()
  return apiRequest<any>({
    method: 'GET',
    path: q ? `/auth/me/bids/?${q}` : '/auth/me/bids/',
    token: accessToken,
  })
}

export async function listMyItems(accessToken: string) {
  return apiRequest<any>({
    method: 'GET',
    path: '/items/',
    token: accessToken,
  })
}

export async function createItem(accessToken: string, payload: any) {
  return apiRequest<any>({
    method: 'POST',
    path: '/items/',
    token: accessToken,
    body: payload,
  })
}

export async function updateItem(accessToken: string, itemId: string, payload: any) {
  return apiRequest<any>({
    method: 'PATCH',
    path: `/items/${itemId}/`,
    token: accessToken,
    body: payload,
  })
}

export async function uploadItemImage(accessToken: string, itemId: string, file: File, meta?: { alt_text?: string; sort_order?: number }) {
  const form = new FormData()
  form.append('image', file)
  if (meta?.alt_text !== undefined) form.append('alt_text', meta.alt_text)
  if (meta?.sort_order !== undefined) form.append('sort_order', String(meta.sort_order))

  return apiRequest<any>({
    method: 'POST',
    path: `/items/${itemId}/upload_image/`,
    token: accessToken,
    body: form,
  })
}

export async function getAuction(accessToken: string | null, auctionId: string) {
  return apiRequest<any>({
    method: 'GET',
    path: `/auctions/${auctionId}/`,
    token: accessToken,
  })
}

export type ListAuctionsParams = {
  category?: string | number
  /** Search item title / description (DRF `search`) */
  search?: string
  status?: string
  exclude_status?: string
  end_after?: string
  end_before?: string
  start_after?: string
  start_before?: string
  ordering?: string
  page?: number
}

export async function listAuctions(params?: ListAuctionsParams) {
  const sp = new URLSearchParams()
  if (params?.category != null && String(params.category) !== '') {
    sp.set('category', String(params.category))
  }
  if (params?.search?.trim()) {
    sp.set('search', params.search.trim())
  }
  if (params?.status) {
    sp.set('status', params.status)
  }
  if (params?.exclude_status) {
    sp.set('exclude_status', params.exclude_status)
  }
  if (params?.end_after) {
    sp.set('end_after', params.end_after)
  }
  if (params?.end_before) {
    sp.set('end_before', params.end_before)
  }
  if (params?.start_after) {
    sp.set('start_after', params.start_after)
  }
  if (params?.start_before) {
    sp.set('start_before', params.start_before)
  }
  if (params?.ordering) {
    sp.set('ordering', params.ordering)
  }
  if (params?.page != null && params.page > 1) {
    sp.set('page', String(params.page))
  }
  const q = sp.toString()
  return apiRequest<any>({
    method: 'GET',
    path: q ? `/auctions/?${q}` : '/auctions/',
  })
}

export async function listCategories() {
  const res = await apiRequest<any>({
    method: 'GET',
    path: '/categories/',
  })
  // DRF pagination returns { results: [...] }
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.results)) return res.results
  return []
}

export async function getItem(accessToken: string, itemId: string) {
  return apiRequest<any>({
    method: 'GET',
    path: `/items/${itemId}/`,
    token: accessToken,
  })
}

export async function listItemImages(accessToken: string, itemId: string) {
  return apiRequest<any[]>({
    method: 'GET',
    path: `/items/${itemId}/images/`,
    token: accessToken,
  })
}

export async function deleteItemImage(accessToken: string, itemId: string, imageId: string) {
  return apiRequest<any>({
    method: 'DELETE',
    path: `/items/${itemId}/images/${imageId}/`,
    token: accessToken,
  })
}

export async function createAuctionDraft(accessToken: string, payload: any) {
  return apiRequest<any>({
    method: 'POST',
    path: '/auctions/',
    token: accessToken,
    body: payload,
  })
}

export async function startAuction(accessToken: string, auctionId: string, payload: any) {
  return apiRequest<any>({
    method: 'POST',
    path: `/auctions/${auctionId}/start/`,
    token: accessToken,
    body: payload,
  })
}

export async function placeBid(accessToken: string, auctionId: string, amount: string) {
  return apiRequest<any>({
    method: 'POST',
    path: `/auctions/${auctionId}/bid/`,
    token: accessToken,
    body: { amount },
  })
}

export async function addToWatchlist(accessToken: string, auctionId: string) {
  return apiRequest<any>({
    method: 'POST',
    path: `/auctions/${auctionId}/add_to_watchlist/`,
    token: accessToken,
    body: {},
  })
}

export async function removeFromWatchlist(accessToken: string, auctionId: string) {
  return apiRequest<any>({
    method: 'POST',
    path: `/auctions/${auctionId}/remove_from_watchlist/`,
    token: accessToken,
    body: {},
  })
}

