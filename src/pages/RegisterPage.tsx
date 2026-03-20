import React, { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { registerUser } from '../app/api/rest'

export function RegisterPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await registerUser({
        email,
        password,
        password2,
        first_name: firstName,
        last_name: lastName,
      })
      navigate({ to: '/auth/login' })
    } catch (err: any) {
      setError(err?.message ?? 'Register failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <h1 className="mb-4 text-xl font-semibold">Register</h1>
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
            First name
          </span>
          <input
            className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            type="text"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Last name
          </span>
          <input
            className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            type="text"
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
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Confirm password
          </span>
          <input
            className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
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
          {loading ? 'Creating...' : 'Create account'}
        </button>
      </form>
    </div>
  )
}

