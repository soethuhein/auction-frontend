/** @vitest-environment happy-dom */
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { LoginPage } from '../../pages/LoginPage'

const mockNavigate = vi.fn()
const mockSetAccessToken = vi.fn()
const mockSetRefreshToken = vi.fn()
const mockLoginUser = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('../../app/auth/AuthContext', () => ({
  useAuth: () => ({
    setAccessToken: mockSetAccessToken,
    setRefreshToken: mockSetRefreshToken,
  }),
}))

vi.mock('../../app/api/rest', () => ({
  loginUser: (payload) => mockLoginUser(payload),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form and UI elements', () => {
    render(<LoginPage />)

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^login$/i })).toBeInTheDocument()
  })

  it('handles email and password input changes', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)

    await user.type(emailInput, 'user@example.com')
    await user.type(passwordInput, 'Secret123!')

    expect(emailInput).toHaveValue('user@example.com')
    expect(passwordInput).toHaveValue('Secret123!')
  })

  it('submits form when login button is clicked', async () => {
    const user = userEvent.setup()
    mockLoginUser.mockResolvedValue({
      access: 'access-token',
      refresh: 'refresh-token',
    })

    render(<LoginPage />)

    await user.type(screen.getByLabelText(/email/i), 'user@example.com')
    await user.type(screen.getByLabelText(/password/i), 'Secret123!')
    await user.click(screen.getByRole('button', { name: /^login$/i }))

    await waitFor(() => {
      expect(mockLoginUser).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'Secret123!',
      })
    })
    expect(mockSetAccessToken).toHaveBeenCalledWith('access-token')
    expect(mockSetRefreshToken).toHaveBeenCalledWith('refresh-token')
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/',
      search: { category: undefined },
    })
  })
})
