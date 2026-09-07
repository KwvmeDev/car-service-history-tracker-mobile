import * as SecureStore from 'expo-secure-store'

/**
 * The session token's ONLY home (ADR 0003, docs/security.md §Authentication).
 *
 * expo-secure-store and nothing else — no AsyncStorage, no react-native-mmkv, no
 * module-scope token variable. Every read, write and clear of the Better Auth Expo
 * session goes through this module so the "SecureStore-only" rule is auditable in one
 * file (security-guard sign-off, subtask 13).
 *
 * WHEN_UNLOCKED_THIS_DEVICE_ONLY: the entry is not copied to a new device on restore
 * and is unreadable while the device is locked.
 */

export const AUTH_STORAGE_PREFIX = 'revv'
export const AUTH_SCHEME = 'revv'

const COOKIE_STORE_KEY = `${AUTH_STORAGE_PREFIX}_cookie`
const SESSION_DATA_KEY = `${AUTH_STORAGE_PREFIX}_session_data`

// Better Auth (server config uses the default cookie prefix) names the session cookie
// `better-auth.session_token`; `__Secure-` is the https variant.
const SESSION_COOKIE_NAMES = [
  'better-auth.session_token',
  '__Secure-better-auth.session_token',
] as const

const STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
}

/** Storage object handed to @better-auth/expo's expoClient — SecureStore, scoped. */
export const secureAuthStorage = {
  getItem: (key: string): string | null => SecureStore.getItem(key, STORE_OPTIONS),
  setItem: (key: string, value: string): void => {
    SecureStore.setItem(key, value, STORE_OPTIONS)
  },
  getItemAsync: (key: string): Promise<string | null> =>
    SecureStore.getItemAsync(key, STORE_OPTIONS),
  setItemAsync: (key: string, value: string): Promise<void> =>
    SecureStore.setItemAsync(key, value, STORE_OPTIONS),
}

interface StoredCookie {
  value?: string
  expires?: string
}

/**
 * Pulls the live session token out of the cookie map @better-auth/expo persists.
 * Exported for the middleware test; not for general use.
 */
export function extractSessionToken(rawCookieMap: string | null): string | null {
  if (rawCookieMap === null || rawCookieMap.length === 0) {
    return null
  }

  let parsed: Record<string, StoredCookie>
  try {
    parsed = JSON.parse(rawCookieMap) as Record<string, StoredCookie>
  } catch {
    return null
  }

  for (const name of SESSION_COOKIE_NAMES) {
    const entry = parsed[name]
    if (entry?.value === undefined || entry.value.length === 0) {
      continue
    }
    if (entry.expires !== undefined && new Date(entry.expires).getTime() < Date.now()) {
      continue
    }
    return entry.value
  }
  return null
}

/** The current session token, or null. Reads SecureStore and nothing else. */
export async function getSessionToken(): Promise<string | null> {
  const raw = await SecureStore.getItemAsync(COOKIE_STORE_KEY, STORE_OPTIONS)
  return extractSessionToken(raw)
}

/** Remove every SecureStore entry the auth client owns (sign-out). */
export async function clearStoredSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(COOKIE_STORE_KEY, STORE_OPTIONS),
    SecureStore.deleteItemAsync(SESSION_DATA_KEY, STORE_OPTIONS),
  ])
}
