# Auction frontend

Single-page app for the auction platform: browse and filter listings, place bids, manage items and drafts, and use seller/buyer flows. Built with **React 19**, **Vite**, **TypeScript**, **TanStack Router**, and **Tailwind CSS**. It talks to the Django REST API through `apiRequest` in [`src/lib/apiClient.ts`](src/lib/apiClient.ts) and the typed helpers in [`src/app/api/rest.ts`](src/app/api/rest.ts).

## Features

- **Authentication** — Register and login; JWT access and refresh tokens in `localStorage`. Expired access tokens trigger a refresh via [`src/lib/apiClient.ts`](src/lib/apiClient.ts); auth state stays in sync with [`src/app/auth/AuthContext.tsx`](src/app/auth/AuthContext.tsx).
- **Public / browsing** — Home dashboard with optional category filter; full browse page with search, filters, sort, and pagination; auction detail with bidding, watchlist, and live updates over WebSockets (base URL from [`src/lib/env.ts`](src/lib/env.ts) `getWsBaseUrl`).
- **Seller / inventory** — List, create, and edit items; upload images; create auction drafts; “My auctions” with a status filter.
- **Buyer** — “My bids” with won/all filter; profile page.
- **Admin** — Routes under `/admin` for dashboard, items, auctions, and bids. Who can use them depends on your backend and role checks.

## Environment variables

Configured in [`src/lib/env.ts`](src/lib/env.ts):

| Variable | Purpose |
| -------- | ------- |
| `VITE_API_BASE_URL` | Backend origin (e.g. `http://127.0.0.1:8000`). If unset, the app falls back to `http://127.0.0.1:8000`. |
| `VITE_WS_BASE_URL` | Optional explicit WebSocket base URL. |
| `window.__API_BASE_URL__` or `window.__VITE_API_BASE_URL__` | Optional runtime override when serving a static `dist` build. |

`.env` is gitignored; create it locally or copy a team template. Example:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Routes

Defined in [`src/app/router.tsx`](src/app/router.tsx). Static paths like `/auctions/browse` are registered before `/auctions/$auctionId` so they are not parsed as IDs.

| Path | Purpose |
| ---- | ------- |
| `/` | Dashboard — search: `category` (optional category slug) |
| `/auth/login` | Login |
| `/auth/register` | Register |
| `/profile` | Profile |
| `/auctions/browse` | Browse — `q`, `category`, `status`, `end_after`, `end_before`, `ordering`, `page` |
| `/auctions/my` | My auctions — `status`: `all` \| `active` \| `ended` \| `draft` |
| `/auctions/my-bids` | My bids — `filter`: `all` \| `won` |
| `/auctions/new` | Create auction draft |
| `/auctions/$auctionId` | Auction detail |
| `/items` | Items list |
| `/items/new` | New item |
| `/items/$itemId` | Edit item |
| `/admin` | Admin dashboard |
| `/admin/items` | Admin items |
| `/admin/auctions` | Admin auctions |
| `/admin/bids` | Admin bids |

## Prerequisites

- **Node.js** and **npm**
- **Backend API** running at the URL you set in `VITE_API_BASE_URL` (or the default above)

## How to run

```bash
npm install
npm run dev      # Vite dev server (HMR)
npm run build    # tsc -b && vite build
npm run preview  # Preview production build locally
npm run lint     # ESLint
```

## Tests

Tests use **Vitest** ([`vitest.config.ts`](vitest.config.ts)).

```bash
npm test         # Single run (vitest run)
npm run test:watch   # Watch mode
```

Current suites live under [`src/lib/__tests__/`](src/lib/__tests__/):

| File | What it covers |
| ---- | -------------- |
| `apiClient.test.js` | `buildAuthHeaders`, `apiRequest` sends `Authorization` |
| `timeSync.test.js` | Server time offset and remaining time helpers |
| `startAuctionPayload.test.js` | Start-auction payload helpers |
| `auctionReducer.test.js` | Auction-related reducer logic |

**Contributors:** `vitest.config.ts` only includes `src/**/*.{test,spec}.{js,jsx}`. TypeScript test files such as `*.test.ts` are not picked up until you extend that `include` pattern.

## More documentation

- [Vite](https://vite.dev/)
