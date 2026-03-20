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

  const [platform, setPlatform] = useState('Steam')
  const [region, setRegion] = useState('global')
  const [language, setLanguage] = useState('')
  const [licenseType, setLicenseType] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState('')

  const [attributesJson, setAttributesJson] = useState('{ "version": "1.0" }')

  useEffect(() => {
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
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!accessToken) return

    let attributes: any = {}
    try {
      attributes = attributesJson.trim() ? JSON.parse(attributesJson) : {}
    } catch {
      setError('attributes must be valid JSON')
      return
    }

    try {
      const created = await createItem(accessToken, {
        item_type: itemType,
        title,
        description,
        category_id: categoryId ? Number(categoryId) : null,
        attributes,
        platform,
        region,
        language,
        license_type: licenseType,
        delivery_method: deliveryMethod,
      })
      navigate({ to: '/items/$itemId', params: { itemId: created.id } })
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create item')
    }
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Platform
            </span>
            <input
              className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Region
            </span>
            <input
              className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Language
            </span>
            <input
              className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              License type
            </span>
            <input
              className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
              value={licenseType}
              onChange={(e) => setLicenseType(e.target.value)}
            />
          </label>
        </div>

        <label className="grid gap-1">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Delivery method
          </span>
          <input
            className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            value={deliveryMethod}
            onChange={(e) => setDeliveryMethod(e.target.value)}
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Attributes (JSON)
          </span>
          <textarea
            className="min-h-[100px] rounded border border-gray-300 px-3 py-2 font-mono text-xs dark:border-gray-700 dark:bg-gray-800"
            value={attributesJson}
            onChange={(e) => setAttributesJson(e.target.value)}
          />
        </label>

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

