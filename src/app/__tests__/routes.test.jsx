/** @vitest-environment happy-dom */
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthContext'
import { routeTree } from '../router'
import * as rest from '../api/rest'

const AUCTION_ID = '550e8400-e29b-41d4-a716-446655440000'

const mockAuction = {
  id: AUCTION_ID,
  status: 'ended',
  is_seller: false,
  is_watched: false,
  current_price: '10.00',
  bids: [],
  start_time: null,
  end_time: null,
  item: { title: 'Mock auction item', images: [] },
  seller: { id: 's1', email: 'seller@example.com' },
}

const emptyAdminStats = {
  total_users: 1,
  active_auctions: 0,
  completed_auctions: 0,
  bids_today: 0,
  total_revenue: '0',
  commission: '0',
  commission_rate: 0.05,
  pending_reports: 0,
  pending_item_approvals: 0,
}

vi.mock('../api/rest', async (importOriginal) => {
  const mod = await importOriginal()
  return {
    ...mod,
    listAuctions: vi.fn(() => Promise.resolve({ results: [], count: 0 })),
    listCategories: vi.fn(() => Promise.resolve([])),
    getMe: vi.fn(() =>
      Promise.resolve({
        id: 'u1',
        email: 'user@example.com',
        is_staff: false,
        is_superuser: false,
      }),
    ),
    getAdminStats: vi.fn(() => Promise.resolve(emptyAdminStats)),
    getAuction: vi.fn(() => Promise.resolve(mockAuction)),
  }
})

function renderRoute(initialPath) {
  const history = createMemoryHistory({ initialEntries: [initialPath] })
  const testRouter = createRouter({ routeTree, history })
  return render(
    <AuthProvider>
      <RouterProvider router={testRouter} />
    </AuthProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
  globalThis.WebSocket = class MockWebSocket {
    static OPEN = 1
    constructor(url) {
      this.url = url
      this.readyState = MockWebSocket.OPEN
    }
    close() {}
    send() {}
  }
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('App routes (smoke)', () => {
  it('renders home at /', async () => {
    renderRoute('/')
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: /^BidSphere$/ }),
      ).toBeInTheDocument()
    })
  })

  it('renders login at /auth/login', async () => {
    renderRoute('/auth/login')
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^Login$/ })).toBeInTheDocument()
    })
  })

  it('renders register at /auth/register', async () => {
    renderRoute('/auth/register')
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^Register$/ })).toBeInTheDocument()
    })
  })

  it('renders browse at /auctions/browse', async () => {
    renderRoute('/auctions/browse')
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Browse auctions/i })).toBeInTheDocument()
    })
  })

  it('renders auction detail at /auctions/:auctionId', async () => {
    renderRoute(`/auctions/${AUCTION_ID}`)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Mock auction item/i })).toBeInTheDocument()
    })
    expect(rest.getAuction).toHaveBeenCalledWith(null, AUCTION_ID)
  })

  it('renders admin shell at /admin when staff token and getMe is staff', async () => {
    localStorage.setItem('auth.access_token', 'test-access')
    localStorage.setItem('auth.refresh_token', 'test-refresh')
    vi.mocked(rest.getMe).mockResolvedValue({
      id: 'staff1',
      email: 'staff@example.com',
      is_staff: true,
      is_superuser: false,
    })

    renderRoute('/admin')

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Admin Dashboard/i })).toBeInTheDocument()
    })
    expect(screen.getByRole('navigation', { name: /Admin sections/i })).toBeInTheDocument()
  })
})
