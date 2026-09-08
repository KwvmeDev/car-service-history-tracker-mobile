import Constants from 'expo-constants'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { MMKV } from 'react-native-mmkv'

import * as pushApi from './api'

/**
 * Server-push registration (Sprint 8). After notification permission is granted the
 * app fetches its Expo push token and POSTs it to `/v1/push-tokens`; the daily
 * server job then delivers reminder pushes. Platform-split — `push-registration.web.ts`
 * is a set of no-ops (the Expo Router web target is a preview; push is a device
 * feature and `expo-notifications` has no web build we use).
 *
 * The token value is not logged. The last-registered token is kept in MMKV (not
 * SecureStore — it is not a credential) so sign-out can deregister it and so a
 * rotation only re-POSTs when it actually changed.
 */

const store = new MMKV({ id: 'revv-push-registration' })
const LAST_TOKEN_KEY = 'lastRegisteredToken'

function platform(): 'ios' | 'android' | 'web' {
  if (Platform.OS === 'ios') return 'ios'
  if (Platform.OS === 'android') return 'android'
  return 'web'
}

function projectId(): string | undefined {
  const eas = (Constants.expoConfig?.extra as { eas?: { projectId?: unknown } } | undefined)?.eas
  return typeof eas?.projectId === 'string' ? eas.projectId : undefined
}

async function resolveExpoToken(): Promise<string | null> {
  const existing = await Notifications.getPermissionsAsync()
  const granted = existing.granted
    ? true
    : (await Notifications.requestPermissionsAsync()).granted
  if (!granted) return null
  try {
    const id = projectId()
    const result = await Notifications.getExpoPushTokenAsync(id ? { projectId: id } : undefined)
    return result.data
  } catch {
    return null
  }
}

function deviceName(): string | undefined {
  return typeof Constants.deviceName === 'string' && Constants.deviceName.length > 0
    ? Constants.deviceName
    : undefined
}

async function sendRegistration(token: string): Promise<void> {
  await pushApi.registerPushToken({
    token,
    platform: platform(),
    ...(deviceName() ? { deviceName: deviceName() } : {}),
  })
  store.set(LAST_TOKEN_KEY, token)
}

/** Register this device for reminder push. Call once per authenticated session. */
export async function registerForPush(): Promise<void> {
  const token = await resolveExpoToken()
  if (!token) return
  await sendRegistration(token)
}

/** Deregister on sign-out. Best-effort — a failure never blocks sign-out. */
export async function unregisterFromPush(): Promise<void> {
  const token = store.getString(LAST_TOKEN_KEY)
  if (!token) return
  try {
    await pushApi.unregisterPushToken(token)
  } catch {
    // best-effort; the server also prunes dead tokens on send
  }
  store.delete(LAST_TOKEN_KEY)
}

/** Re-register when Expo rotates the token. Returns an unsubscribe function. */
export function watchPushTokenChanges(): () => void {
  const sub = Notifications.addPushTokenListener((event: Notifications.DevicePushToken | { data?: unknown }) => {
    const raw: unknown = typeof event === 'string' ? event : event.data
    const next = typeof raw === 'string' ? raw : null
    if (next !== null && next !== store.getString(LAST_TOKEN_KEY)) {
      void sendRegistration(next)
    }
  })
  return () => {
    sub.remove()
  }
}
