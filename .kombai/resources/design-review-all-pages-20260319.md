# Design Review Results: All User-Facing Pages

**Review Date**: 2026-03-19  
**Routes Reviewed**: `/` · `/auth/login` · `/auth/register` · `/auctions/$auctionId` · `/auctions/my` · `/items` · `/items/new` · `/items/$itemId`  
**Focus Areas**: Visual Design · Responsive/Mobile · Performance

---

## Summary

The app has a solid structural foundation — good dark-mode support, a consistent purple accent colour, and a reasonable component breakdown. However, **a single global CSS rule (`text-align: center` on `#root`) cascades destructively across every form and table** making them visually broken. Performance is impacted by a large external hero image and by re-implementing data-fetching with raw `useEffect`/`useState` on every page despite TanStack Query already being installed. Several responsive and polish gaps (no focus rings, no active nav state, flash-of-content on auth redirect) round out the findings.

---

## Issues

| # | Issue | Criticality | Category | Location |
|---|-------|-------------|----------|----------|
| 1 | `text-align: center` on `#root` cascades center-alignment to all descendant text including form labels and table cells, making every form look broken | 🔴 Critical | Visual Design | `src/index.css:94` |
| 2 | `:root { … }` block duplicated in full (lines 6–36 identical to 38–68), adding unnecessary CSS weight | 🟡 Medium | Visual Design | `src/index.css:38-68` |
| 3 | Hero background image loaded from an external URL on `themeslay.com` — causes ~2 MB page load, third-party dependency with no SLA, and broken image risk | 🟠 High | Performance | `src/pages/DashboardPage.tsx:37-39` |
| 4 | Input elements across all forms have no visible focus indicator — no `focus:ring-*`, `focus:border-*`, or `outline` change — violates WCAG 2.4.7 | 🟠 High | Visual Design | `src/pages/LoginPage.tsx:39-40`, `src/pages/RegisterPage.tsx:49-50`, `src/pages/ItemNewPage.tsx:106-109`, `src/pages/ItemEditPage.tsx:216-219` |
| 5 | Auth-guarded pages (`/items`, `/auctions/my`, `/items/$itemId`) use `useEffect + navigate` for auth redirect, causing a visible flash of unauthenticated/loading content before redirect | 🟠 High | Visual Design | `src/pages/ItemsPage.tsx:14-17`, `src/pages/MyAuctionsPage.tsx:14-17`, `src/pages/ItemEditPage.tsx:46-47` |
| 6 | All data-fetching pages (`DashboardPage`, `MyAuctionsPage`, `ItemsPage`, `AuctionDetailPage`, `ItemEditPage`) use raw `useEffect`/`useState` for API calls — TanStack Query (`@tanstack/react-query`) is already a dependency and provides caching, deduplication, background refetch, and loading/error states for free | 🟠 High | Performance | `src/pages/DashboardPage.tsx:10-23`, `src/pages/MyAuctionsPage.tsx:13-31`, `src/pages/ItemsPage.tsx:13-31`, `src/pages/AuctionDetailPage.tsx:77-93`, `src/pages/ItemEditPage.tsx:45-79` |
| 7 | `DashboardPage` shows "No auctions found." immediately with no distinct loading state (no spinner, no skeleton) — users can't tell if the page is loading or genuinely empty | 🟡 Medium | Visual Design | `src/pages/DashboardPage.tsx:85-95` |
| 8 | `AuctionDetailPage` loading state is plain unstyled text `Loading...` with no spinner or skeleton screen, giving no visual feedback | 🟡 Medium | Visual Design | `src/pages/AuctionDetailPage.tsx:218` |
| 9 | `ItemEditPage` loading state is the same plain `Loading...` text | 🟡 Medium | Visual Design | `src/pages/ItemEditPage.tsx:163` |
| 10 | Nav links in `RootLayout` have no active/current route styling — TanStack Router's `activeProps` should be used to highlight the current page | 🟡 Medium | Visual Design | `src/app/RootLayout.tsx:10-28` |
| 11 | `ItemNewPage` and `ItemEditPage` forms have no max-width cap — on wide monitors (≥1024px) they stretch across the full `max-w-6xl` container making single fields excessively wide | 🟡 Medium | Responsive/Mobile | `src/pages/ItemNewPage.tsx:91-219`, `src/pages/ItemEditPage.tsx:181-307` |
| 12 | Start Auction form label reads `start_time (optional)` — leaks internal API field name instead of a human-friendly label like "Start date & time (optional)" | 🟡 Medium | Visual Design | `src/pages/AuctionDetailPage.tsx:353-355` |
| 13 | Duration fields in Start Auction form are labelled `days`, `hours`, `minutes` (lowercase, no capitalisation, no unit hint like "0–30") — minimal labelling for a time-sensitive action | 🟡 Medium | Visual Design | `src/pages/AuctionDetailPage.tsx:366-400` |
| 14 | Bid amount input has a fixed `w-32` width — on narrow mobile viewports this is functionally adequate but looks cramped; no `inputMode="decimal"` validation feedback or currency symbol | 🟡 Medium | Responsive/Mobile | `src/pages/AuctionDetailPage.tsx:295-301` |
| 15 | `LoginPage` has no link to the Register page and `RegisterPage` has no link to the Login page — users are stranded if they land on the wrong auth page | 🟡 Medium | Visual Design | `src/pages/LoginPage.tsx`, `src/pages/RegisterPage.tsx` |
| 16 | `AuthStatusBar` logout button has no hover state — `border-gray-300` button has no `hover:bg-*` class | ⚪ Low | Visual Design | `src/app/auth/AuthStatusBar.tsx:29-32` |
| 17 | All primary action buttons use only `rounded` (= `rounded-xs` in Tailwind v4, ~2px) while page containers use `rounded-lg` / `rounded-2xl` — inconsistent border-radius system | ⚪ Low | Visual Design | `src/pages/LoginPage.tsx:65-71`, `src/pages/AuctionDetailPage.tsx:303-307`, `src/pages/ItemsPage.tsx:39-43` |
| 18 | `AuctionCard` "No image" fallback is plain text inside a link — could be a neutral placeholder box with an icon | ⚪ Low | Visual Design | `src/components/AuctionCard.tsx:28-35` |
| 19 | `MyAuctionsPage` page header CTA reads "Create auction (via item)" which is confusing to end users — the parenthetical leaks implementation details | ⚪ Low | Visual Design | `src/pages/MyAuctionsPage.tsx:41` |
| 20 | `ItemsPage` table header cells (`<th>`) have no `font-weight` override — they inherit browser bold but there's no explicit heading style or text-transform applied | ⚪ Low | Visual Design | `src/pages/ItemsPage.tsx:55-63` |
| 21 | `AuctionDetailPage` interval running every 500ms is not necessary for countdown accuracy — 1 000ms (1 second) would halve the re-renders | ⚪ Low | Performance | `src/pages/AuctionDetailPage.tsx:59-62` |

---

## Criticality Legend
- 🔴 **Critical**: Breaks functionality or violates accessibility standards
- 🟠 **High**: Significantly impacts user experience or design quality
- 🟡 **Medium**: Noticeable issue that should be addressed
- ⚪ **Low**: Nice-to-have improvement

---

## Next Steps

**Immediate (1 Critical, 4 High)**

1. **Fix `text-align: center` on `#root`** (`src/index.css:94`) — change to `text-align: left` or remove it entirely; the hero section can apply its own `text-center` if needed.
2. **Replace external hero image** with a local asset in `public/` or a reliable CDN URL. Alternatively use a CSS gradient background to eliminate the external dependency entirely.
3. **Add focus rings to all inputs** — add `focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500` (or a shared `@utility`) to every `<input>`, `<textarea>`, and `<select>`.
4. **Migrate data-fetching to TanStack Query** — wrap `main.tsx` in `<QueryClientProvider>`, convert each `useEffect`/`useState` fetch to `useQuery`, and use `useMutation` for form submissions.
5. **Move auth guards to route `beforeLoad`** (TanStack Router) to prevent flash of unauthenticated content.

**Short-term (Medium issues 7–15)**

- Add loading skeletons / spinners on all data pages.
- Use TanStack Router `activeProps` on nav links.
- Add cross-links between Login and Register pages.
- Constrain form widths (`max-w-2xl` or similar) on edit pages.
- Fix `start_time` label and duration field labels in AuctionDetailPage.

**Polish (Low issues 16–21)**

- Add hover states to all interactive elements.
- Standardise border-radius tokens (`rounded-md` on buttons).
- Improve `AuctionCard` image placeholder.
- Rename "Create auction (via item)" CTA.
- Reduce countdown interval to 1 000ms.
