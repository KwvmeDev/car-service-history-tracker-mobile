import Constants from 'expo-constants'

/**
 * API base URL, in priority order:
 *   1. EXPO_PUBLIC_API_BASE_URL — set per EAS build profile in eas.json
 *   2. app.json → extra.apiBaseUrl — the local-dev default
 *   3. localhost fallback
 *
 * Never hard-coded at a call site (engineering-standards.md §Frontend).
 */
export const apiBaseUrl: string =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Constants.expoConfig?.extra?.['apiBaseUrl'] as string | undefined) ??
  'http://localhost:3000'
