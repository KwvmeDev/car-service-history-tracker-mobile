import Constants from 'expo-constants'

/**
 * Social sign-in configuration (ADR 0003). Google/Apple client IDs are supplied per
 * environment via `app.json` → `extra` / EAS env (scaffold-plan §0). A provider button
 * only renders when its config is present — no dead buttons.
 */

interface SocialExtra {
  googleWebClientId?: string
  googleIosClientId?: string
  appleClientId?: string
}

function socialExtra(): SocialExtra {
  const raw: unknown = Constants.expoConfig?.extra
  if (raw !== null && typeof raw === 'object') {
    const record = raw as Record<string, unknown>
    return {
      googleWebClientId: asString(record.googleWebClientId),
      googleIosClientId: asString(record.googleIosClientId),
      appleClientId: asString(record.appleClientId),
    }
  }
  return {}
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

const extra = socialExtra()

export const googleConfig =
  extra.googleWebClientId != null && extra.googleWebClientId.length > 0
    ? { webClientId: extra.googleWebClientId, iosClientId: extra.googleIosClientId }
    : null

export const appleConfig =
  extra.appleClientId != null && extra.appleClientId.length > 0
    ? { clientId: extra.appleClientId }
    : null

export const isGoogleEnabled = googleConfig !== null
export const isAppleEnabled = appleConfig !== null
