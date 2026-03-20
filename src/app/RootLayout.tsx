import { useState } from 'react'
import { Link, Outlet } from '@tanstack/react-router'
import { AuthStatusBar } from './auth/AuthStatusBar'

const navLinkClass =
  'rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors ' +
  'hover:bg-blue-50 hover:text-blue-700 ' +
  'dark:text-gray-400 dark:hover:bg-blue-950/40 dark:hover:text-blue-300 ' +
  'data-[status=active]:bg-blue-50 data-[status=active]:text-blue-700 ' +
  'dark:data-[status=active]:bg-blue-950/40 dark:data-[status=active]:text-blue-300'

const mobileNavLinkClass =
  'block rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition-colors ' +
  'hover:bg-blue-50 hover:text-blue-700 ' +
  'dark:text-gray-400 dark:hover:bg-blue-950/40 dark:hover:text-blue-300 ' +
  'data-[status=active]:bg-blue-50 data-[status=active]:text-blue-700 ' +
  'dark:data-[status=active]:bg-blue-950/40 dark:data-[status=active]:text-blue-300'

export function RootLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/90">

        {/* Top bar */}
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5">

          {/* Brand */}
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="flex shrink-0 items-center gap-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="BidSphere home"
            onClick={closeMenu}
          >
            <img src="/favicon.svg" alt="" aria-hidden="true" className="h-7 w-auto" />
            <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-lg font-bold tracking-tight text-transparent">
              BidSphere
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main navigation">
            <Link to="/" activeOptions={{ exact: true }} className={navLinkClass}>Dashboard</Link>
            <Link to="/items" className={navLinkClass}>Items</Link>
            <Link to="/auctions/my" className={navLinkClass}>My Auctions</Link>
            <Link to="/admin" className={navLinkClass}>Admin</Link>
          </nav>

          {/* Desktop auth + mobile hamburger */}
          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <AuthStatusBar />
            </div>

            {/* Hamburger button — mobile only */}
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 md:hidden"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {menuOpen ? (
                /* X icon */
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                /* Hamburger icon */
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {menuOpen && (
          <div
            id="mobile-menu"
            className="border-t border-gray-100 px-4 pb-4 pt-2 md:hidden dark:border-gray-800"
          >
            <nav className="flex flex-col gap-0.5" aria-label="Mobile navigation">
              <Link to="/" activeOptions={{ exact: true }} className={mobileNavLinkClass} onClick={closeMenu}>Dashboard</Link>
              <Link to="/items" className={mobileNavLinkClass} onClick={closeMenu}>Items</Link>
              <Link to="/auctions/my" className={mobileNavLinkClass} onClick={closeMenu}>My Auctions</Link>
              <Link to="/admin" className={mobileNavLinkClass} onClick={closeMenu}>Admin</Link>
            </nav>
            <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">
              <AuthStatusBar />
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
