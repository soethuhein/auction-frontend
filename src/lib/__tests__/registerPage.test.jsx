/** @vitest-environment happy-dom */
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { RegisterPage } from '../../pages/RegisterPage'

const mockNavigate = vi.fn()
const mockRegisterUser = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('../../app/api/rest', () => ({
  registerUser: (payload) => mockRegisterUser(payload),
}))

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form and UI elements', () => {
    render(<RegisterPage />)

    expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('handles input changes for register fields', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)

    await user.type(screen.getByLabelText(/email/i), 'newuser@example.com')
    await user.type(screen.getByLabelText(/first name/i), 'New')
    await user.type(screen.getByLabelText(/last name/i), 'User')
    await user.type(screen.getByLabelText(/^password$/i), 'Secret123!')
    await user.type(screen.getByLabelText(/confirm password/i), 'Secret123!')

    expect(screen.getByLabelText(/email/i)).toHaveValue('newuser@example.com')
    expect(screen.getByLabelText(/first name/i)).toHaveValue('New')
    expect(screen.getByLabelText(/last name/i)).toHaveValue('User')
    expect(screen.getByLabelText(/^password$/i)).toHaveValue('Secret123!')
    expect(screen.getByLabelText(/confirm password/i)).toHaveValue('Secret123!')
  })

  it('submits form when create account button is clicked', async () => {
    const user = userEvent.setup()
    mockRegisterUser.mockResolvedValue({})

    render(<RegisterPage />)

    await user.type(screen.getByLabelText(/email/i), 'newuser@example.com')
    await user.type(screen.getByLabelText(/first name/i), 'New')
    await user.type(screen.getByLabelText(/last name/i), 'User')
    await user.type(screen.getByLabelText(/^password$/i), 'Secret123!')
    await user.type(screen.getByLabelText(/confirm password/i), 'Secret123!')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(mockRegisterUser).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'Secret123!',
        password2: 'Secret123!',
        first_name: 'New',
        last_name: 'User',
      })
    })
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/auth/login' })
  })
})
