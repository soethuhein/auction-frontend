import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '../app/auth/AuthContext'
import {
  createItem,
  listCategories,
} from '../app/api/rest'

export function ItemNewPage() {
  const { accessToken } = useAuth()
  const navigate = useNavigate()

  const [categories, setCategories] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const [itemType, setItemType] = useState<'digital' | 'physical'>('digital')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<string>('') // integer from backend

  useEffect(() => {
    if (!accessToken) {
      navigate({ to: '/auth/login' })
      return
    }

    let mounted = true
    ;(async () => {
      try {
        const res = await listCategories()
        if (mounted) setCategories(res)
      } catch {
        // ignore; user can still create without category
      }
    })()
    return () => {
      mounted = false
    }
  }, [accessToken, navigate])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!accessToken) return

    try {
      const created = await createItem(accessToken, {
        item_type: itemType,
        title,
        description,
        category_id: categoryId ? Number(categoryId) : null,
        attributes: {},
      })
      navigate({ to: '/items/$itemId', params: { itemId: created.id } })
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create item')
    }
  }

  if (!accessToken) {
    return (
      <div className="rounded border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
        Redirecting to login…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Create Item</h1>
        <Link to="/items" className="text-sm text-purple-700 hover:underline">
          Back to items
        </Link>
      </div>

      {error ? (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="grid gap-3">
        <label className="grid gap-1">
          <span className="text-sm text-gray-700 dark:text-gray-300">Type</span>
          <select
            className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            value={itemType}
            onChange={(e) => setItemType(e.target.value as any)}
          >
            <option value="digital">Digital</option>
            <option value="physical">Physical</option>
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-gray-700 dark:text-gray-300">Title</span>
          <input
            className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Description
          </span>
          <textarea
            className="min-h-[90px] rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Category (optional)
          </span>
          <select
            className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <details className="rounded border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
          <summary className="cursor-pointer font-medium text-gray-800 dark:text-gray-200">
            Tips: optional metadata for listings (API / future UI)
          </summary>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            You can describe everything important in <strong>Description</strong>. If you integrate structured data later,
            common <code className="rounded bg-gray-200 px-1 dark:bg-gray-800">attributes</code> keys include:{' '}
            <code className="rounded bg-gray-200 px-1 dark:bg-gray-800">condition</code> (new/used/refurbished),{' '}
            <code className="rounded bg-gray-200 px-1 dark:bg-gray-800">brand</code>, <code className="rounded bg-gray-200 px-1 dark:bg-gray-800">model</code>,{' '}
            <code className="rounded bg-gray-200 px-1 dark:bg-gray-800">year</code>, <code className="rounded bg-gray-200 px-1 dark:bg-gray-800">location</code> or{' '}
            <code className="rounded bg-gray-200 px-1 dark:bg-gray-800">ships_from</code>, <code className="rounded bg-gray-200 px-1 dark:bg-gray-800">warranty</code>,{' '}
            <code className="rounded bg-gray-200 px-1 dark:bg-gray-800">includes</code> (array). For digital items:{' '}
            <code className="rounded bg-gray-200 px-1 dark:bg-gray-800">delivery</code>, <code className="rounded bg-gray-200 px-1 dark:bg-gray-800">region_lock</code>.
          </p>
        </details>

        <button
          type="submit"
          disabled={!accessToken}
          className="rounded bg-purple-600 px-4 py-2 text-white disabled:opacity-50"
        >
          Create item
        </button>
      </form>
    </div>
  )
}
