import { useState } from 'react'
import { Appearance } from 'react-native'
import { MMKV } from 'react-native-mmkv'

/**
 * The user's light/dark choice. `system` (the default) follows the phone; `light` and
 * `dark` pin the app via `Appearance.setColorScheme`, so every `useColorScheme()`
 * consumer — `useColors()`, native switches, the status bar — follows with no extra
 * plumbing. A UI convenience, so MMKV, not SecureStore or the server.
 */

export type ThemePreference = 'system' | 'light' | 'dark'

const KEY = 'appearance.theme'
const VALID: readonly ThemePreference[] = ['system', 'light', 'dark']

export interface KeyValueStore {
  set(key: string, value: string): void
  getString(key: string): string | undefined
}

let shared: KeyValueStore | undefined
function store(): KeyValueStore {
  shared ??= new MMKV({ id: 'revv-ui' })
  return shared
}

export function loadThemePreference(kv: KeyValueStore = store()): ThemePreference {
  const raw = kv.getString(KEY)
  return VALID.includes(raw as ThemePreference) ? (raw as ThemePreference) : 'system'
}

export function applyThemePreference(preference: ThemePreference): void {
  Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference)
}

export function saveThemePreference(preference: ThemePreference, kv: KeyValueStore = store()): void {
  kv.set(KEY, preference)
  applyThemePreference(preference)
}

export function useThemePreference(): [ThemePreference, (next: ThemePreference) => void] {
  const [preference, setPreference] = useState<ThemePreference>(() => loadThemePreference())
  return [
    preference,
    (next) => {
      setPreference(next)
      saveThemePreference(next)
    },
  ]
}
