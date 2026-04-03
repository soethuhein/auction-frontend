import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '../../app/auth/AuthContext'
import {
  deleteAdminItemImage,
  getAdminItem,
  getMe,
  listAdminItemImages,
  listCategories,
  updateAdminItem,
  uploadAdminItemImage,
} from '../../app/api/rest'
import { adminItemEditRoute } from '../../app/router'
import { resolveMediaUrl } from '../../lib/env'

function ownerLine(owner: {
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

export function AdminItemEditPage() {
  const { accessToken } = useAuth()
  const navigate = useNavigate()
  const { itemId } = adminItemEditRoute.useParams()

  const [item, setItem] = useState<any | null>(null)
  const [images, setImages] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  const [itemType, setItemType] = useState<'digital' | 'physical'>('digital')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')

  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadAlt, setUploadAlt] = useState('')
  const [uploadSort, setUploadSort] = useState<number>(0)

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
      try {
        const [it, imgs, cats] = await Promise.all([
          getAdminItem(accessToken, itemId),
          listAdminItemImages(accessToken, itemId),
          listCategories(),
        ])
        if (!mounted) return
        setItem(it)
        setImages(imgs)
        setCategories(cats)
        setItemType(it.item_type)
        setTitle(it.title ?? '')
        setDescription(it.description ?? '')
        setCategoryId(it.category ? String(it.category.id) : '')
      } catch (e: any) {
        if (mounted) setError(e?.message ?? 'Failed to load item')
      }
    })()
    return () => {
      mounted = false
    }
  }, [accessToken, isAdmin, itemId])

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken) return
    setError(null)
    try {
      const attrs =
        item?.attributes && typeof item.attributes === 'object' && !Array.isArray(item.attributes)
          ? item.attributes
          : {}
      const updated = await updateAdminItem(accessToken, itemId, {
        item_type: itemType,
        title,
        description,
        category_id: categoryId ? Number(categoryId) : null,
        attributes: attrs,
      })
      setItem(updated)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update item')
    }
  }

  async function onUploadImage(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken || !uploadFile) return
    setError(null)
    try {
      await uploadAdminItemImage(accessToken, itemId, uploadFile, {
        alt_text: uploadAlt,
        sort_order: uploadSort,
      })
      const imgs = await listAdminItemImages(accessToken, itemId)
      setImages(imgs)
      setUploadFile(null)
      setUploadAlt('')
      setUploadSort(0)
    } catch (err: any) {
      setError(err?.message ?? 'Image upload failed')
    }
  }

  async function onDeleteImage(imageId: string) {
    if (!accessToken) return
    setError(null)
    try {
      await deleteAdminItemImage(accessToken, itemId, imageId)
      const imgs = await listAdminItemImages(accessToken, itemId)
      setImages(imgs)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete image')
    }
  }

  if (isAdmin === null) {
    return <div className="text-sm text-gray-600">Checking admin access...</div>
  }
  if (!isAdmin) return null

  if (!item && !error) {
    return <div className="text-sm text-gray-600">Loading...</div>
  }

  if (!item) {
    return (
      <div className="space-y-4">
        {error ? (
          <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200">
            {error}
          </div>
        ) : null}
        <Link to="/admin/items" className="text-sm text-purple-700 hover:underline dark:text-purple-300">
          Back to admin items
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Admin — Edit item</h1>
        <Link to="/admin/items" className="text-sm text-purple-700 hover:underline dark:text-purple-300">
          Back to admin items
        </Link>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Owner: <span className="font-medium text-gray-900 dark:text-white">{ownerLine(item.owner)}</span>
      </p>

      {error ? (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <form onSubmit={onSave} className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm text-gray-700 dark:text-gray-300">Type</span>
            <select
              className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
              value={itemType}
              onChange={(e) => setItemType(e.target.value as 'digital' | 'physical')}
            >
              <option value="digital">Digital</option>
              <option value="physical">Physical</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-700 dark:text-gray-300">Category</span>
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
        </div>

        <label className="grid gap-1">
          <span className="text-sm text-gray-700 dark:text-gray-300">Title</span>
          <input
            className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-gray-700 dark:text-gray-300">Description</span>
          <textarea
            className="min-h-[90px] rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <details className="rounded border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
          <summary className="cursor-pointer font-medium text-gray-800 dark:text-gray-200">
            Optional metadata (attributes)
          </summary>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Existing <code className="rounded bg-gray-200 px-1 dark:bg-gray-800">attributes</code> are kept on
            save. Extend the API if you need inline editing of arbitrary keys.
          </p>
        </details>

        <button type="submit" className="rounded bg-purple-600 px-4 py-2 text-white">
          Save changes
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Images</h2>

        <form onSubmit={onUploadImage} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-sm text-gray-700 dark:text-gray-300">Upload image</span>
            <input
              type="file"
              accept="image/*"
              className="rounded border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <label className="flex w-56 flex-col gap-1">
            <span className="text-sm text-gray-700 dark:text-gray-300">alt_text</span>
            <input
              className="rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              value={uploadAlt}
              onChange={(e) => setUploadAlt(e.target.value)}
            />
          </label>
          <label className="flex w-32 flex-col gap-1">
            <span className="text-sm text-gray-700 dark:text-gray-300">sort</span>
            <input
              className="rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              value={uploadSort}
              onChange={(e) => setUploadSort(Number(e.target.value))}
              type="number"
            />
          </label>
          <button
            type="submit"
            disabled={!uploadFile}
            className="rounded bg-purple-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Upload
          </button>
        </form>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img) => (
            <div key={img.id} className="rounded border border-gray-200 p-2 dark:border-gray-800">
              {img.image_url ? (
                <img
                  src={resolveMediaUrl(img.image_url) ?? img.image_url}
                  alt={img.alt_text ?? ''}
                  className="h-32 w-full object-cover"
                />
              ) : null}
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">#{img.sort_order ?? 0}</span>
                <button
                  className="text-xs text-red-600 hover:underline"
                  onClick={() => onDeleteImage(img.id)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {images.length === 0 ? (
            <div className="col-span-full text-sm text-gray-600 dark:text-gray-400">No images yet.</div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
