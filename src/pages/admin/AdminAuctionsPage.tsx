import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '../../app/auth/AuthContext'
import { getMe, listMyAuctions } from '../../app/api/rest'
import { AuctionCard } from '../../components/AuctionCard'

export function AdminAuctionsPage() {
  const { accessToken } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<any | null>(null)
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

        const res = await listMyAuctions(accessToken)
        if (mounted) setData(res)
      } catch (e: any) {
        if (mounted) setError(e?.message ?? 'Failed to load auctions')
      }
    })()

    return () => {
      mounted = false
    }
  }, [accessToken, navigate])

  if (isAdmin === null) {
    return <div className="text-sm text-gray-600">Checking admin access...</div>
  }
  if (!isAdmin) return null

  const auctions = data?.results ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin - Auctions</h1>
        <Link to="/admin" className="text-sm text-purple-700 hover:underline">
          Back
        </Link>
      </div>

      {error ? (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {auctions.length === 0 ? (
        <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
          No auctions.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {auctions.map((a: any) => (
            <AuctionCard key={a.id} auction={a} />
          ))}
        </div>
      )}
    </div>
  )
}

