import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { DEFAULT_BROWSE_SEARCH } from '../../app/browseSearchDefaults'

function AdminNavLink({
  to,
  search,
  children,
}: {
  to: string
  search?: Record<string, unknown>
  children: React.ReactNode
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const active =
    to === '/admin'
      ? pathname === '/admin'
      : pathname === to || pathname.startsWith(`${to}/`)

  return (
    <Link
      to={to}
      {...(search ? { search } : {})}
      className={
        active
          ? 'block rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
          : 'block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-900'
      }
    >
      {children}
    </Link>
  )
}

export function AdminLayout() {
  return (
    <div className="-mx-4 -my-6 flex min-h-[calc(100vh-5.5rem)] flex-col md:flex-row md:items-stretch">
      <aside
        className="flex w-full shrink-0 flex-col border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/80 md:w-[240px] md:border-b-0 md:border-r md:min-h-full"
        aria-label="Admin navigation"
      >
        <div className="flex flex-1 flex-col p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Admin menu
          </h2>
          <nav className="flex flex-1 flex-col space-y-2" aria-label="Admin sections">
            <AdminNavLink to="/admin">Dashboard</AdminNavLink>
            <AdminNavLink to="/admin/users">Users</AdminNavLink>
            <AdminNavLink to="/admin/items">Items</AdminNavLink>
            <AdminNavLink to="/admin/auctions" search={DEFAULT_BROWSE_SEARCH}>
              Auctions
            </AdminNavLink>
            <AdminNavLink to="/admin/bids">Bids</AdminNavLink>
          </nav>
        </div>
      </aside>

      <div className="min-w-0 flex-1 bg-white px-4 py-6 dark:bg-gray-950 md:px-6">
        <Outlet />
      </div>
    </div>
  )
}
