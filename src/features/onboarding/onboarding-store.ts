import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

/**
 * "Has this device finished (or skipped) the first-launch onboarding carousel" —
 * a device-local UI flag, not session data. It reuses `expo-secure-store` (already
 * installed and native-linked for the session token, session-store.ts) rather than
 * adding `@react-native-async-storage/async-storage` as a second native storage
 * dependency for one boolean; SecureStore is overkill for something this
 * non-sensitive, but "zero new native modules" won out.
 *
 * Web (a preview target only, per session-store.ts) has no SecureStore — onboarding
 * is a native-app concept, so the web preview always reports "seen" and skips it.
 */

const ONBOARDING_SEEN_KEY = 'revv_onboarding_seen'
const IS_WEB = Platform.OS === 'web'

export async function hasSeenOnboarding(): Promise<boolean> {
  if (IS_WEB) return true
  const value = await SecureStore.getItemAsync(ONBOARDING_SEEN_KEY)
  return value === 'true'
}

export async function markOnboardingSeen(): Promise<void> {
  if (IS_WEB) return
  await SecureStore.setItemAsync(ONBOARDING_SEEN_KEY, 'true')
}
