import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'

import { RootLayout } from './RootLayout'

import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'
import { DashboardPage } from '../pages/DashboardPage'
import { AuctionDetailPage } from '../pages/AuctionDetailPage'
import { BrowseAuctionsPage } from '../pages/BrowseAuctionsPage'
import { MyAuctionsPage } from '../pages/MyAuctionsPage'
import { ItemsPage } from '../pages/ItemsPage'
import { ItemNewPage } from '../pages/ItemNewPage'
import { ItemEditPage } from '../pages/ItemEditPage'
import { CreateAuctionDraftPage } from '../pages/CreateAuctionDraftPage'
import { MyBidsPage } from '../pages/MyBidsPage'
import { ProfilePage } from '../pages/ProfilePage'
import { AdminLayout } from '../pages/admin/AdminLayout'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'
import { AdminItemEditPage } from '../pages/admin/AdminItemEditPage'
import { AdminItemsPage } from '../pages/admin/AdminItemsPage'
import { AdminAuctionsPage } from '../pages/admin/AdminAuctionsPage'
import { AdminBidsPage } from '../pages/admin/AdminBidsPage'
import { AdminUsersPage } from '../pages/admin/AdminUsersPage'

const rootRoute = createRootRoute({
  component: () => <RootLayout />,
})

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
  validateSearch: (search: Record<string, unknown>) => ({
    category: typeof search?.category === 'string' ? search.category : undefined,
  }),
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/login',
  component: LoginPage,
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/register',
  component: RegisterPage,
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfilePage,
})

function parseBrowsePage(raw: unknown): number {
  if (typeof raw === 'number' && raw >= 1 && Number.isInteger(raw)) return raw
  if (typeof raw === 'string') {
    const n = parseInt(raw, 10)
    if (Number.isFinite(n) && n >= 1) return n
  }
  return 1
}

/** Must be registered before `/auctions/$auctionId` so `browse` is not treated as an id. */
export const browseAuctionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auctions/browse',
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search?.q === 'string' ? search.q : undefined,
    category: typeof search?.category === 'string' ? search.category : undefined,
    status: typeof search?.status === 'string' ? search.status : undefined,
    end_after: typeof search?.end_after === 'string' ? search.end_after : undefined,
    end_before: typeof search?.end_before === 'string' ? search.end_before : undefined,
    ordering: typeof search?.ordering === 'string' ? search.ordering : undefined,
    page: parseBrowsePage(search?.page),
  }),
  component: BrowseAuctionsPage,
})

export const myAuctionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auctions/my',
  validateSearch: (search: Record<string, unknown>) => ({
    status:
      search?.status === 'active' || search?.status === 'ended' || search?.status === 'draft'
        ? search.status
        : 'all',
  }),
  component: MyAuctionsPage,
})

/** Static path; must be registered before `/auctions/$auctionId`. */
export const myBidsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auctions/my-bids',
  validateSearch: (search: Record<string, unknown>) => ({
    filter: search?.filter === 'won' ? 'won' : 'all',
  }),
  component: MyBidsPage,
})

/** Static path; must be registered before `/auctions/$auctionId`. */
export const createAuctionDraftRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auctions/new',
  component: CreateAuctionDraftPage,
})

export const auctionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auctions/$auctionId',
  component: AuctionDetailPage,
})

export const itemsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/items',
  component: ItemsPage,
})

export const itemNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/items/new',
  component: ItemNewPage,
})

export const itemEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/items/$itemId',
  component: ItemEditPage,
})

// Admin layout: sidebar + full-height shell for all /admin/* routes
export const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminLayout,
})

export const adminRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/',
  component: AdminDashboardPage,
})

export const adminUsersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'users',
  component: AdminUsersPage,
})

/** Registered before `items` so `/admin/items/:id` is not swallowed by the list route. */
export const adminItemEditRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'items/$itemId',
  component: AdminItemEditPage,
})

export const adminItemsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'items',
  component: AdminItemsPage,
})

export const adminAuctionsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'auctions',
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search?.q === 'string' ? search.q : undefined,
    category: typeof search?.category === 'string' ? search.category : undefined,
    status: typeof search?.status === 'string' ? search.status : undefined,
    end_after: typeof search?.end_after === 'string' ? search.end_after : undefined,
    end_before: typeof search?.end_before === 'string' ? search.end_before : undefined,
    ordering: typeof search?.ordering === 'string' ? search.ordering : undefined,
    page: parseBrowsePage(search?.page),
  }),
  component: AdminAuctionsPage,
})

export const adminBidsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'bids',
  component: AdminBidsPage,
})

/** Exported for tests that build a router with `createMemoryHistory`. */
export const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  profileRoute,
  browseAuctionsRoute,
  myAuctionsRoute,
  myBidsRoute,
  createAuctionDraftRoute,
  auctionDetailRoute,
  itemsRoute,
  itemNewRoute,
  itemEditRoute,
  adminLayoutRoute.addChildren([
    adminRoute,
    adminUsersRoute,
    adminItemEditRoute,
    adminItemsRoute,
    adminAuctionsRoute,
    adminBidsRoute,
  ]),
])

export const router = createRouter({
  routeTree,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export function AppRouterProvider() {
  return <RouterProvider router={router} />
}

