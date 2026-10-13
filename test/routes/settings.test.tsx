import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'

import * as prefsApi from '@/features/notifications/preferences-api'
import type { NotificationPreferences } from '@/features/notifications/types'

import Settings from '../../app/(tabs)/settings'

const mockSignOut = jest.fn()
const mockUseSession = jest.fn()
const mockUseTwoFactor = jest.fn()

jest.mock('expo-router', () => ({ Stack: { Screen: () => null }, useRouter: () => ({ push: jest.fn() }) }))
jest.mock('expo-constants', () => ({ expoConfig: { version: '0.1.0' } }))
jest.mock('@/features/notifications/preferences-api')
jest.mock('@/features/auth/use-session', () => ({ useSignOut: () => mockSignOut }))
jest.mock('@/features/auth/auth-client', () => ({ authClient: { useSession: () => mockUseSession() } }))
jest.mock('@/features/security/use-two-factor', () => ({ useTwoFactor: () => mockUseTwoFactor() }))
jest.mock('@/features/security/TwoFactorEnrollSheet', () => ({ TwoFactorEnrollSheet: () => null }))

const mockPrefs = jest.mocked(prefsApi)

const ALL_ON: NotificationPreferences = {
  remindersDue: true,
  remindersOverdue: true,
  remindersUpcoming: true,
  quietHoursStart: null,
  quietHoursEnd: null,
}

function wrap(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  mockUseSession.mockReturnValue({
    data: { user: { name: 'Dana', email: 'dana@example.test', emailVerified: true } },
  })
  mockUseTwoFactor.mockReturnValue({
    enabled: false,
    step: 'idle',
    pending: false,
    error: null,
    start: jest.fn(),
    disable: jest.fn(),
  })
  mockPrefs.getNotificationPreferences.mockResolvedValue(ALL_ON)
  mockPrefs.updateNotificationPreferences.mockResolvedValue(ALL_ON)
})

describe('Settings screen', () => {
  it('renders the four sections with account and about details', async () => {
    wrap(<Settings />)
    // the section headers and account details render synchronously
    expect(screen.getByText('Account')).toBeTruthy()
    expect(screen.getByText('Notifications')).toBeTruthy()
    expect(screen.getByText('Security')).toBeTruthy()
    expect(screen.getByText('About')).toBeTruthy()
    expect(screen.getByText('dana@example.test')).toBeTruthy()
    // the notification toggles arrive once the preferences query resolves
    expect(await screen.findByText('Due soon', {}, { timeout: 5000 })).toBeTruthy()
  }, 15000)

  it('toggling a notification category calls the mutation', async () => {
    wrap(<Settings />)
    const toggle = await screen.findByLabelText('Overdue')
    fireEvent(toggle, 'valueChange', false)
    await waitFor(() => {
      expect(mockPrefs.updateNotificationPreferences).toHaveBeenCalledWith({ remindersOverdue: false })
    })
  })

  it('the security row reflects the not-enrolled state', () => {
    wrap(<Settings />)
    expect(screen.getByText('Two-factor authentication')).toBeTruthy()
    expect(screen.getByText('Set up two-factor')).toBeTruthy()
  })

  it('shows the 2FA on state when enrolled', () => {
    mockUseTwoFactor.mockReturnValue({
      enabled: true,
      step: 'idle',
      pending: false,
      error: null,
      start: jest.fn(),
      disable: jest.fn(),
    })
    wrap(<Settings />)
    expect(screen.getByText('Turn off two-factor')).toBeTruthy()
  })

  it('sign out clears the session', () => {
    wrap(<Settings />)
    fireEvent(screen.getByText('Sign out'), 'touchEnd')
    expect(mockSignOut).toHaveBeenCalled()
  })
})
