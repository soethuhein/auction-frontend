import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '../../app/auth/AuthContext'
import { getMe, listAdminItems } from '../../app/api/rest'

const PAGE_SIZE = 20

function ownerLabel(owner: {
  email?: string
  username?: string
  first_name?: string
  last_name?: string
} | null | undefined): string {
  if (!owner) return '—'
  const name = [owner.first_name, owner.last_name].filter(Boolean).join(' ').trim()
  if (owner.email && name) return `${owner.email} (${name})`
  if (owner.email) return owner.email
  if (name) return name
  return owner.username ?? '—'
}

export function AdminItemsPage() {
  const { accessToken } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<any | null>(null)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    if (!accessToken) {
      navigate({ to: '/auth/login' })
      return
    }
    let mounted = true
    ;(async () => {
      try {
        const me = await getMe(accessToken)
        const admin = Boolean(me?.is_superuser || me?.is_staff)
        if (!admin) {
          if (mounted) {
            setIsAdmin(false)
            navigate({ to: '/', search: { category: undefined } })
          }
          return
        }
        if (mounted) setIsAdmin(true)
      } catch {
        if (mounted) setIsAdmin(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [accessToken, navigate])

  useEffect(() => {
    if (!accessToken || !isAdmin) return
    let mounted = true
    ;(async () => {
      setError(null)
      try {
        const res = await listAdminItems(accessToken, page)
        if (mounted) setData(res)
      } catch (e: any) {
        if (mounted) setError(e?.message ?? 'Failed to load items')
      }
    })()
    return () => {
      mounted = false
    }
  }, [accessToken, isAdmin, page])

  if (isAdmin === null) {
    return <div className="text-sm text-gray-600">Checking admin access...</div>
  }
  if (!isAdmin) return null

  const items = data?.results ?? []
  const totalCount = typeof data?.count === 'number' ? data.count : items.length
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin - Items</h1>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Total items:{' '}
        <span className="font-semibold text-gray-900 dark:text-white">{totalCount}</span>
      </p>

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
              <th className="p-3">Owner</th>
              <th className="p-3">Type</th>
              <th className="p-3">Category</th>
              <th className="p-3">Edit</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it: any) => (
              <tr key={it.id} className="border-t border-gray-200 dark:border-gray-800">
                <td className="p-3 font-medium">{it.title}</td>
                <td className="p-3 text-gray-800 dark:text-gray-200">{ownerLabel(it.owner)}</td>
                <td className="p-3">{it.item_type}</td>
                <td className="p-3 text-gray-800 dark:text-gray-200">
                  {it.category?.name ?? '—'}
                </td>
                <td className="p-3">
                  <Link
                    to="/admin/items/$itemId"
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
                <td className="p-4 text-gray-600 dark:text-gray-400" colSpan={5}>
                  No items.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {totalCount > PAGE_SIZE ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600"
          >
            Previous
          </button>
          <span className="text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  )
}
