import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '../app/auth/AuthContext'
import { listMyItems } from '../app/api/rest'

export function ItemsPage() {
  const { accessToken } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken) {
      navigate({ to: '/auth/login' })
      return
    }

    let mounted = true
    ;(async () => {
      try {
        const res = await listMyItems(accessToken)
        if (mounted) setData(res)
      } catch (e: any) {
        if (mounted) setError(e?.message ?? 'Failed to load items')
      }
    })()

    return () => {
      mounted = false
    }
  }, [accessToken, navigate])

  const items = data?.results ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">My Items</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/auctions/new"
            className="rounded border border-purple-600 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50 dark:border-purple-500 dark:text-purple-300 dark:hover:bg-purple-950/40"
          >
            Create draft auction
          </Link>
          <Link
            to="/items/new"
            className="rounded bg-purple-600 px-3 py-2 text-sm text-white"
          >
            Create item
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Type</th>
              <th className="p-3">Images</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it: any) => (
              <tr
                key={it.id}
                className="border-t border-gray-200 dark:border-gray-800"
              >
                <td className="p-3 font-medium">{it.title}</td>
                <td className="p-3">{it.item_type}</td>
                <td className="p-3">{it.images?.length ?? 0}</td>
                <td className="p-3">
                  <Link
                    to="/items/$itemId"
                    params={{ itemId: it.id }}
                    className="text-sm text-purple-700 hover:underline dark:text-purple-300"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td className="p-4 text-gray-600 dark:text-gray-400" colSpan={4}>
                  No items yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

