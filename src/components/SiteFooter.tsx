import { Link } from '@tanstack/react-router'
import { DEFAULT_BROWSE_SEARCH } from '../app/browseSearchDefaults'
import { useAuth } from '../app/auth/AuthContext'

const footerLinkClass =
  'text-sm text-gray-600 transition-colors hover:text-blue-700 dark:text-gray-400 dark:hover:text-blue-300'

export function SiteFooter() {
  const { accessToken } = useAuth()
  const year = new Date().getFullYear()

  return (
    <footer
      className="mt-auto border-t border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-950/80"
      role="contentinfo"
    >
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <img src="/favicon.svg" alt="" aria-hidden className="h-8 w-auto" />
              <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-lg font-bold tracking-tight text-transparent">
                BidSphere
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              Discover live auctions, list your items, and bid with confidence.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500">
              Explore
            </h2>
            <ul className="flex flex-col gap-2">
              <li>
                <Link to="/" search={{ category: undefined }} className={footerLinkClass}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/auctions/browse" search={DEFAULT_BROWSE_SEARCH} className={footerLinkClass}>
                  Browse auctions
                </Link>
              </li>
              {accessToken ? (
                <li>
                  <Link to="/items" className={footerLinkClass}>
                    My items
                  </Link>
                </li>
              ) : null}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500">
              Account
            </h2>
            <ul className="flex flex-col gap-2">
              {accessToken ? (
                <>
                  <li>
                    <Link to="/profile" className={footerLinkClass}>
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link to="/auctions/my" search={{ status: 'all' }} className={footerLinkClass}>
                      My auctions
                    </Link>
                  </li>
                  <li>
                    <Link to="/auctions/my-bids" search={{ filter: 'all' }} className={footerLinkClass}>
                      My bids
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/auth/login" className={footerLinkClass}>
                      Log in
                    </Link>
                  </li>
                  <li>
                    <Link to="/auth/register" className={footerLinkClass}>
                      Create account
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-200 pt-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-500">
          © {year} BidSphere. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
