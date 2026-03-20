import { Link } from '@tanstack/react-router'
import { useAuth } from './AuthContext'

export function AuthStatusBar() {
  const { accessToken, clearAuth } = useAuth()

  if (!accessToken) {
    return (
      <div className="flex shrink-0 items-center gap-2">
        <Link
          to="/auth/login"
          className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-blue-700 dark:text-gray-400 dark:hover:text-blue-300"
        >
          Login
        </Link>
        <Link
          to="/auth/register"
          className="rounded-md bg-blue-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
        >
          Register
        </Link>
      </div>
    )
  }

  return (
    <div className="flex shrink-0 items-center gap-3">
      <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
        <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
        Signed in
      </span>
      <button
        type="button"
        className="rounded-md border border-gray-200 px-3.5 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        onClick={() => clearAuth()}
      >
        Logout
      </button>
    </div>
  )
}
