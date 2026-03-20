import React, { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { loginUser } from '../app/api/rest'
import { useAuth } from '../app/auth/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { setAccessToken, setRefreshToken } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await loginUser({ email, password })
      setAccessToken(res.access)
      setRefreshToken(res.refresh)
      navigate({ to: '/' })
    } catch (err: any) {
      setError(err?.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <h1 className="mb-4 text-xl font-semibold">Login</h1>
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-700 dark:text-gray-300">Email</span>
          <input
            className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Password
          </span>
          <input
            className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
        </label>

        {error ? (
          <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded bg-purple-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  )
}

