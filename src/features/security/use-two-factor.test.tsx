import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react-native'

import * as tfApi from './two-factor-api'
import { useTwoFactor, useTwoFactorChallenge } from './use-two-factor'

const mockUseSession = jest.fn()
jest.mock('@/features/auth/auth-client', () => ({
  authClient: { useSession: () => mockUseSession() },
}))
jest.mock('./two-factor-api')
const mockApi = jest.mocked(tfApi)

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}
const client = () => new QueryClient({ defaultOptions: { mutations: { retry: false } } })

beforeEach(() => {
  mockUseSession.mockReturnValue({ data: { user: { twoFactorEnabled: false } } })
})

describe('useTwoFactor — enrollment', () => {
  it('walks password → confirm → done on the happy path', async () => {
    mockApi.beginTwoFactorEnrollment.mockResolvedValue({
      ok: true,
      enrollment: { totpURI: 'otpauth://totp/Revv:a?secret=ABC', secret: 'ABC', backupCodes: ['x-1', 'y-2'] },
    })
    mockApi.verifyTotp.mockResolvedValue({ ok: true })

    const { result } = renderHook(() => useTwoFactor(), { wrapper: wrapper(client()) })

    act(() => {
      result.current.start()
    })
    expect(result.current.step).toBe('password')

    await act(async () => {
      await result.current.submitPassword('hunter2000')
    })
    expect(result.current.step).toBe('confirm')
    expect(result.current.enrollment?.secret).toBe('ABC')

    await act(async () => {
      await result.current.confirmCode('123456')
    })
    expect(result.current.step).toBe('done')
  })

  it('surfaces a wrong confirm code as an inline error and stays on confirm', async () => {
    mockApi.beginTwoFactorEnrollment.mockResolvedValue({
      ok: true,
      enrollment: { totpURI: 'otpauth://totp/x?secret=S', secret: 'S', backupCodes: [] },
    })
    mockApi.verifyTotp.mockResolvedValue({ ok: false, code: 'INVALID_CODE', message: 'That code is not right. Try again.' })

    const { result } = renderHook(() => useTwoFactor(), { wrapper: wrapper(client()) })
    act(() => {
      result.current.start()
    })
    await act(async () => {
      await result.current.submitPassword('pw')
    })
    await act(async () => {
      await result.current.confirmCode('000000')
    })

    expect(result.current.step).toBe('confirm')
    expect(result.current.error).toMatch(/not right/i)
  })

  it('a wrong password does not advance past the password step', async () => {
    mockApi.beginTwoFactorEnrollment.mockResolvedValue({
      ok: false,
      code: 'INVALID_PASSWORD',
      message: 'That password is not right.',
    })
    const { result } = renderHook(() => useTwoFactor(), { wrapper: wrapper(client()) })
    act(() => {
      result.current.start()
    })
    await act(async () => {
      await result.current.submitPassword('wrong')
    })
    expect(result.current.step).toBe('password')
    expect(result.current.error).toMatch(/password/i)
  })

  it('disable clears the flow on success', async () => {
    mockUseSession.mockReturnValue({ data: { user: { twoFactorEnabled: true } } })
    mockApi.disableTwoFactor.mockResolvedValue({ ok: true })

    const { result } = renderHook(() => useTwoFactor(), { wrapper: wrapper(client()) })
    expect(result.current.enabled).toBe(true)

    let ok = false
    await act(async () => {
      ok = await result.current.disable('hunter2000')
    })
    expect(ok).toBe(true)
    expect(result.current.step).toBe('idle')
  })
})

describe('useTwoFactorChallenge', () => {
  it('completes on a valid TOTP and calls onSuccess', async () => {
    mockApi.verifyTotp.mockResolvedValue({ ok: true })
    const onSuccess = jest.fn()
    const { result } = renderHook(() => useTwoFactorChallenge(), { wrapper: wrapper(client()) })

    await act(async () => {
      await result.current.submit('123456', false, onSuccess)
    })
    expect(onSuccess).toHaveBeenCalled()
    expect(mockApi.verifyTotp).toHaveBeenCalledWith('123456')
  })

  it('uses the backup-code path and shows an inline error on failure', async () => {
    mockApi.verifyBackupCode.mockResolvedValue({
      ok: false,
      code: 'INVALID_BACKUP_CODE',
      message: 'That backup code is not right.',
    })
    const onSuccess = jest.fn()
    const { result } = renderHook(() => useTwoFactorChallenge(), { wrapper: wrapper(client()) })

    await act(async () => {
      await result.current.submit('abc-123', true, onSuccess)
    })
    expect(mockApi.verifyBackupCode).toHaveBeenCalledWith('abc-123')
    expect(onSuccess).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(result.current.error).toMatch(/backup code/i)
    })
  })
})
