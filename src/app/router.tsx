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
import { MyAuctionsPage } from '../pages/MyAuctionsPage'
import { ItemsPage } from '../pages/ItemsPage'
import { ItemNewPage } from '../pages/ItemNewPage'
import { ItemEditPage } from '../pages/ItemEditPage'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'
import { AdminItemsPage } from '../pages/admin/AdminItemsPage'
import { AdminAuctionsPage } from '../pages/admin/AdminAuctionsPage'
import { AdminBidsPage } from '../pages/admin/AdminBidsPage'

const rootRoute = createRootRoute({
  component: () => <RootLayout />,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
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

export const auctionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auctions/$auctionId',
  component: AuctionDetailPage,
})

export const myAuctionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auctions/my',
  component: MyAuctionsPage,
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

// Admin (restricted to "my" data unless you add backend admin endpoints)
export const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminDashboardPage,
})

export const adminItemsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/items',
  component: AdminItemsPage,
})

export const adminAuctionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/auctions',
  component: AdminAuctionsPage,
})

export const adminBidsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/bids',
  component: AdminBidsPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  auctionDetailRoute,
  myAuctionsRoute,
  itemsRoute,
  itemNewRoute,
  itemEditRoute,
  adminRoute,
  adminItemsRoute,
  adminAuctionsRoute,
  adminBidsRoute,
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

