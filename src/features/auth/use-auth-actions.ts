import { useState } from 'react'

import type { AuthResult } from './email-auth'

/**
 * Wraps an async auth action with the loading + inline-error state every auth screen
 * needs. No toasts — the error renders in place (design-system.md).
 */
export function useAuthAction() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(action: () => Promise<AuthResult>, onSuccess?: () => void): Promise<void> {
    setPending(true)
    setError(null)
    try {
      const result = await action()
      if (result.ok) {
        onSuccess?.()
      } else {
        setError(result.message)
      }
    } catch (err) {
      // The user-facing copy is deliberately generic (no toasts, one message,
      // design-system.md), but that means it swallows the real cause — log it so
      // it's still visible in the Metro console while debugging.
      if (__DEV__) {
        console.error('[useAuthAction] action threw', err)
      }
      setError("We couldn't reach the server. Check your connection and try again.")
    } finally {
      setPending(false)
    }
  }

  return {
    pending,
    error,
    run,
    clearError: () => {
      setError(null)
    },
  }
}
