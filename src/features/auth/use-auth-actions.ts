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
    } catch {
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
