import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '../../app/auth/AuthContext'
import { getMe, listAdminUsers, patchAdminUserActive } from '../../app/api/rest'

const PAGE_SIZE = 20

export function AdminUsersPage() {
  const { accessToken } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<any | null>(null)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

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
        const res = await listAdminUsers(accessToken, page)
        if (mounted) setData(res)
      } catch (e: any) {
        if (mounted) setError(e?.message ?? 'Failed to load users')
      }
    })()
    return () => {
      mounted = false
    }
  }, [accessToken, isAdmin, page])

  async function toggleActive(userId: string, nextActive: boolean) {
    if (!accessToken) return
    setBusyId(userId)
    setError(null)
    try {
      await patchAdminUserActive(accessToken, userId, nextActive)
      const res = await listAdminUsers(accessToken, page)
      setData(res)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update user')
    } finally {
      setBusyId(null)
    }
  }

  if (isAdmin === null) {
    return <div className="text-sm text-gray-600">Checking admin access...</div>
  }
  if (!isAdmin) return null

  const users = data?.results ?? []
  const totalCount = typeof data?.count === 'number' ? data.count : users.length
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin — Users</h1>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Total users:{' '}
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
              <th className="p-3">Email</th>
              <th className="p-3">Name</th>
              <th className="p-3">Joined</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => {
              const isProtected = u.is_staff || u.is_superuser
              const canToggle = !isProtected
              return (
                <tr key={u.id} className="border-t border-gray-200 dark:border-gray-800">
                  <td className="p-3 font-mono text-xs">{u.email}</td>
                  <td className="p-3">
                    {[u.first_name, u.last_name].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">
                    {u.date_joined ? new Date(u.date_joined).toLocaleString() : '—'}
                  </td>
                  <td className="p-3">
                    {u.is_superuser ? (
                      <span className="text-purple-700 dark:text-purple-300">Superuser</span>
                    ) : u.is_staff ? (
                      <span className="text-blue-700 dark:text-blue-300">Staff</span>
                    ) : (
                      <span className="text-gray-600 dark:text-gray-400">User</span>
                    )}
                  </td>
                  <td className="p-3">
                    {u.is_active ? (
                      <span className="text-emerald-700 dark:text-emerald-300">Active</span>
                    ) : (
                      <span className="text-red-700 dark:text-red-300">Banned</span>
                    )}
                  </td>
                  <td className="p-3">
                    {canToggle ? (
                      u.is_active ? (
                        <button
                          type="button"
                          disabled={busyId === u.id}
                          className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950/40"
                          onClick={() => void toggleActive(u.id, false)}
                        >
                          {busyId === u.id ? '…' : 'Ban'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busyId === u.id}
                          className="rounded border border-emerald-300 px-2 py-1 text-xs text-emerald-800 hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                          onClick={() => void toggleActive(u.id, true)}
                        >
                          {busyId === u.id ? '…' : 'Unban'}
                        </button>
                      )
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {users.length === 0 ? (
              <tr>
                <td className="p-4 text-gray-600 dark:text-gray-400" colSpan={6}>
                  No users.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50 dark:border-gray-600"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50 dark:border-gray-600"
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  )
}
