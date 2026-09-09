import { expoClient } from '@better-auth/expo/client'
import { twoFactorClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

import { apiBaseUrl } from '@/api/base-url'

import { AUTH_SCHEME, AUTH_STORAGE_PREFIX, clearStoredSession, secureAuthStorage } from './session-store'

/**
 * Set by `signInWithEmail` when the server answers a password sign-in with a
 * `twoFactorRedirect` challenge, so the sign-in screen knows to show the code step.
 * Cleared once the challenge is resolved (or a fresh sign-in starts).
 */
let twoFactorChallengePending = false
export function isTwoFactorChallengePending(): boolean {
  return twoFactorChallengePending
}
export function setTwoFactorChallengePending(value: boolean): void {
  twoFactorChallengePending = value
}

/**
 * Better Auth Expo client (ADR 0003).
 *
 * `baseURL` is revv-api's auth mount (`/api/auth`, AUTH_BASE_PATH in
 * revv-api/src/auth/better-auth.ts). The server's `trustedOrigins` accept `revv://`
 * (prod) and `exp://` (dev) and it runs `plugins: [bearer(), expo()]` so the
 * verification / OAuth deep-link round trip resolves and the session can be carried
 * as a bearer token.
 *
 * Storage is expo-secure-store ONLY (session-store.ts). No session token is held in
 * a module-scope variable in this file.
 */
const AUTH_BASE_URL = new URL('/api/auth', apiBaseUrl).toString()

export const authClient = createAuthClient({
  baseURL: AUTH_BASE_URL,
  plugins: [
    expoClient({
      scheme: AUTH_SCHEME,
      storagePrefix: AUTH_STORAGE_PREFIX,
      storage: secureAuthStorage,
    }),
    // 2FA (Sprint 8). A password sign-in for a 2FA account returns a challenge
    // instead of a session; the sign-in screen renders the code step.
    twoFactorClient({
      onTwoFactorRedirect: () => {
        setTwoFactorChallengePending(true)
      },
    }),
  ],
})

export type AuthClient = typeof authClient

/**
 * Core sign-out: end the Better Auth session, then wipe the SecureStore entries even
 * if the network call failed (a stale local session must not linger). Resetting the
 * TanStack Query cache is the caller's job — see useSignOut in use-session.ts.
 */
export async function signOut(): Promise<void> {
  try {
    await authClient.signOut()
  } finally {
    await clearStoredSession()
  }
}
