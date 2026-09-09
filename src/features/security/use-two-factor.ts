import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { authClient } from '@/features/auth/auth-client'

import {
  beginTwoFactorEnrollment,
  disableTwoFactor,
  verifyBackupCode,
  verifyTotp,
  type TwoFactorEnrollment,
} from './two-factor-api'

type EnrollStep = 'idle' | 'password' | 'confirm' | 'done'

/**
 * Drives the 2FA enroll / confirm / disable flow (Sprint 8). Loading + inline
 * error state per step; no toasts. `authClient.useSession().data.user.twoFactorEnabled`
 * is the source of truth for whether it is on.
 */
export function useTwoFactor() {
  const qc = useQueryClient()
  const session = authClient.useSession() as { data?: { user?: { twoFactorEnabled?: boolean } } }
  const enabled = session.data?.user?.twoFactorEnabled === true

  const [step, setStep] = useState<EnrollStep>('idle')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enrollment, setEnrollment] = useState<TwoFactorEnrollment | null>(null)

  const reset = useCallback(() => {
    setStep('idle')
    setError(null)
    setEnrollment(null)
    setPending(false)
  }, [])

  const start = useCallback(() => {
    setError(null)
    setStep('password')
  }, [])

  const submitPassword = useCallback(async (password: string) => {
    setPending(true)
    setError(null)
    const result = await beginTwoFactorEnrollment(password)
    setPending(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    setEnrollment(result.enrollment)
    setStep('confirm')
  }, [])

  const confirmCode = useCallback(
    async (code: string) => {
      setPending(true)
      setError(null)
      const result = await verifyTotp(code)
      setPending(false)
      if (!result.ok) {
        setError(result.message)
        return
      }
      setStep('done')
      void qc.invalidateQueries()
    },
    [qc],
  )

  const disable = useCallback(
    async (password: string): Promise<boolean> => {
      setPending(true)
      setError(null)
      const result = await disableTwoFactor(password)
      setPending(false)
      if (!result.ok) {
        setError(result.message)
        return false
      }
      reset()
      void qc.invalidateQueries()
      return true
    },
    [qc, reset],
  )

  return {
    enabled,
    step,
    pending,
    error,
    enrollment,
    start,
    submitPassword,
    confirmCode,
    disable,
    reset,
    clearError: () => {
      setError(null)
    },
  }
}

/** Resolve the sign-in 2FA challenge with a TOTP or a backup code. */
export function useTwoFactorChallenge() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(
    async (code: string, isBackupCode: boolean, onSuccess: () => void) => {
      setPending(true)
      setError(null)
      const result = isBackupCode ? await verifyBackupCode(code) : await verifyTotp(code)
      setPending(false)
      if (result.ok) {
        onSuccess()
      } else {
        setError(result.message)
      }
    },
    [],
  )

  return { pending, error, submit, clearError: () => { setError(null) } }
}
