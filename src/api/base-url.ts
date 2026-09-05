import Constants from 'expo-constants'

/**
 * API base URL, in priority order:
 *   1. EXPO_PUBLIC_API_BASE_URL — set per EAS build profile in eas.json
 *   2. app.json → extra.apiBaseUrl — the local-dev default
 *   3. localhost fallback
 *
 * Never hard-coded at a call site (engineering-standards.md §Frontend).
 */
function fromExpoConfig(): string | undefined {
  const extra: unknown = Constants.expoConfig?.extra
  if (extra && typeof extra === 'object' && 'apiBaseUrl' in extra) {
    const value: unknown = (extra as Record<'apiBaseUrl', unknown>).apiBaseUrl
    return typeof value === 'string' ? value : undefined
  }
  return undefined
}

const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL
const fromEnv = typeof envUrl === 'string' && envUrl.length > 0 ? envUrl : undefined

export const apiBaseUrl: string = fromEnv ?? fromExpoConfig() ?? 'http://localhost:3000'
