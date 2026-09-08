import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { unregisterFromPush } from '@/features/notifications/push-registration'

import { authClient, signOut as signOutCore } from './auth-client'

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface SessionUser {
  id: string
  email: string
  name: string
  emailVerified: boolean
}

export interface SessionState {
  status: SessionStatus
  user: SessionUser | null
}

interface RawSessionUser {
  id?: unknown
  email?: unknown
  name?: unknown
  emailVerified?: unknown
}

interface RawSession {
  data?: { user?: RawSessionUser | null } | null
  isPending?: boolean
  isRefetching?: boolean
}

const str = (value: unknown): string => (typeof value === 'string' ? value : '')

/**
 * Pure map from Better Auth's session atom to the three states the app switches on.
 * A warm start has the session cached in SecureStore, so `isPending` is false and
 * there is no reload spinner.
 */
export function toSessionState(raw: RawSession): SessionState {
  const user = raw.data?.user

  if (user?.id !== undefined && user.id !== null) {
    return {
      status: 'authenticated',
      user: {
        id: str(user.id),
        email: str(user.email),
        name: str(user.name),
        emailVerified: user.emailVerified === true,
      },
    }
  }

  if (raw.isPending === true) {
    return { status: 'loading', user: null }
  }

  return { status: 'unauthenticated', user: null }
}

export function useSession(): SessionState {
  const raw = authClient.useSession() as RawSession
  return useMemo(() => toSessionState(raw), [raw])
}

/** Sign out and drop all cached server state (ADR 0004 — the cache is per-user). */
export function useSignOut(): () => Promise<void> {
  const queryClient = useQueryClient()
  return async () => {
    // Deregister this device's push token first — the DELETE needs the session,
    // which signOutCore is about to clear. `unregisterFromPush` never throws.
    await unregisterFromPush()
    await signOutCore()
    queryClient.clear()
  }
}
