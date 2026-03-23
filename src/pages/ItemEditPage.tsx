import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '../app/auth/AuthContext'
import {
  deleteItemImage,
  getItem,
  listItemImages,
  listCategories,
  updateItem,
  uploadItemImage,
} from '../app/api/rest'
import { itemEditRoute } from '../app/router'

export function ItemEditPage() {
  const { accessToken } = useAuth()
  const navigate = useNavigate()
  const { itemId } = itemEditRoute.useParams()

  const [item, setItem] = useState<any | null>(null)
  const [images, setImages] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  // editor fields
  const [itemType, setItemType] = useState<'digital' | 'physical'>('digital')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<string>('') // integer from backend

  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadAlt, setUploadAlt] = useState('')
  const [uploadSort, setUploadSort] = useState<number>(0)

  useEffect(() => {
    let mounted = true
    if (!accessToken) return

    ;(async () => {
      try {
        const [it, imgs, cats] = await Promise.all([
          getItem(accessToken, itemId),
          listItemImages(accessToken, itemId),
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
  }, [accessToken, itemId])

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken) return
    setError(null)

    try {
      const attrs =
        item?.attributes && typeof item.attributes === 'object' && !Array.isArray(item.attributes)
          ? item.attributes
          : {}
      const updated = await updateItem(accessToken, itemId, {
        item_type: itemType,
        title,
        description,
        category_id: categoryId ? Number(categoryId) : null,
        attributes: attrs,
      })
      setItem(updated)
      navigate({ to: '/items/$itemId', params: { itemId } })
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update item')
    }
  }

  async function onUploadImage(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken || !uploadFile) return
    setError(null)
    try {
      await uploadItemImage(accessToken, itemId, uploadFile, {
        alt_text: uploadAlt,
        sort_order: uploadSort,
      })
      // backend returns created object; refresh list
      const imgs = await listItemImages(accessToken, itemId)
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
      await deleteItemImage(accessToken, itemId, imageId)
      const imgs = await listItemImages(accessToken, itemId)
      setImages(imgs)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete image')
    }
  }

  if (!item) {
    return <div className="text-sm text-gray-600">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Item</h1>
        <Link to="/items" className="text-sm text-purple-700 hover:underline">
          Back
        </Link>
      </div>

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
              onChange={(e) => setItemType(e.target.value as any)}
            >
              <option value="digital">Digital</option>
              <option value="physical">Physical</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Category
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
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Description
          </span>
          <textarea
            className="min-h-[90px] rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <details className="rounded border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
          <summary className="cursor-pointer font-medium text-gray-800 dark:text-gray-200">
            Tips: optional metadata for listings (API / future UI)
          </summary>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Common <code className="rounded bg-gray-200 px-1 dark:bg-gray-800">attributes</code> keys include:{' '}
            <code className="rounded bg-gray-200 px-1 dark:bg-gray-800">condition</code>, <code className="rounded bg-gray-200 px-1 dark:bg-gray-800">brand</code>,{' '}
            <code className="rounded bg-gray-200 px-1 dark:bg-gray-800">model</code>, <code className="rounded bg-gray-200 px-1 dark:bg-gray-800">year</code>,{' '}
            <code className="rounded bg-gray-200 px-1 dark:bg-gray-800">location</code>, <code className="rounded bg-gray-200 px-1 dark:bg-gray-800">warranty</code>,{' '}
            <code className="rounded bg-gray-200 px-1 dark:bg-gray-800">includes</code>. For digital: <code className="rounded bg-gray-200 px-1 dark:bg-gray-800">delivery</code>,{' '}
            <code className="rounded bg-gray-200 px-1 dark:bg-gray-800">region_lock</code>. Existing saved attributes are kept when you save edits.
          </p>
        </details>

        <button
          type="submit"
          className="rounded bg-purple-600 px-4 py-2 text-white"
        >
          Save changes
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Images</h2>

        <form onSubmit={onUploadImage} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Upload image
            </span>
            <input
              type="file"
              accept="image/*"
              className="rounded border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <label className="flex w-56 flex-col gap-1">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              alt_text
            </span>
            <input
              className="rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              value={uploadAlt}
              onChange={(e) => setUploadAlt(e.target.value)}
            />
          </label>
          <label className="flex w-32 flex-col gap-1">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              sort
            </span>
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
                <img src={img.image_url} alt={img.alt_text ?? ''} className="h-32 w-full object-cover" />
              ) : null}
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  #{img.sort_order ?? 0}
                </span>
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
            <div className="col-span-full text-sm text-gray-600 dark:text-gray-400">
              No images yet.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}

