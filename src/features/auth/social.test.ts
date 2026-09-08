/**
 * The social providers are config-gated (scaffold-plan §0 — Google/Apple client IDs
 * still pending). With no config the functions no-op cleanly and the buttons hide.
 */
jest.mock('expo-constants', () => ({ expoConfig: { extra: { apiBaseUrl: 'http://localhost:3000' } } }))
jest.mock('expo-apple-authentication', () => ({
  signInAsync: jest.fn(),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
}))
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: { configure: jest.fn(), hasPlayServices: jest.fn(), signIn: jest.fn() },
}))
jest.mock('./auth-client', () => ({ authClient: { signIn: { social: jest.fn() } } }))

import { isAppleEnabled, isGoogleEnabled } from './config'
import { signInWithApple, signInWithGoogle } from './social'

describe('social sign-in (unconfigured)', () => {
  it('reports both providers disabled when no client IDs are set', () => {
    expect(isGoogleEnabled).toBe(false)
    expect(isAppleEnabled).toBe(false)
  })

  it('signInWithGoogle returns a NOT_CONFIGURED result instead of throwing', async () => {
    await expect(signInWithGoogle()).resolves.toMatchObject({ ok: false, code: 'NOT_CONFIGURED' })
  })

  it('signInWithApple returns a NOT_CONFIGURED result instead of throwing', async () => {
    await expect(signInWithApple()).resolves.toMatchObject({ ok: false, code: 'NOT_CONFIGURED' })
  })
})
