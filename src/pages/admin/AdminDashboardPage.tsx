import { Link } from '@tanstack/react-router'

export function AdminDashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <div className="rounded border border-gray-200 p-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-300">
        Backend currently exposes endpoints for "my" data only. This admin UI
        shows your Items, Auctions, and Bids using the authenticated endpoints.
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          to="/admin/items"
          className="rounded border border-gray-200 p-4 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
        >
          <div className="text-sm font-semibold">Items</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Manage item listings
          </div>
        </Link>
        <Link
          to="/admin/auctions"
          className="rounded border border-gray-200 p-4 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
        >
          <div className="text-sm font-semibold">Auctions</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Your auction lifecycle
          </div>
        </Link>
        <Link
          to="/admin/bids"
          className="rounded border border-gray-200 p-4 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
        >
          <div className="text-sm font-semibold">Bids</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Your bid history
          </div>
        </Link>
      </div>
    </div>
  )
}

