import * as AppleAuthentication from 'expo-apple-authentication'
import { GoogleSignin } from '@react-native-google-signin/google-signin'

import { authClient } from './auth-client'
import { appleConfig, googleConfig } from './config'
import type { AuthResult } from './email-auth'

/**
 * Native social sign-in (ADR 0003): the provider SDK returns an **idToken**, which is
 * sent to revv-api and verified server-side against the provider's keys
 * (revv-api/src/auth/social-verify.ts). The app never asserts identity itself.
 *
 * Each function no-ops with a clear message when its provider is not configured
 * (googleConfig / appleConfig null) — the screen also hides the button, this is defence
 * in depth.
 */

let googleConfigured = false
function ensureGoogleConfigured(): void {
  if (googleConfigured || googleConfig === null) return
  GoogleSignin.configure({
    webClientId: googleConfig.webClientId,
    iosClientId: googleConfig.iosClientId,
  })
  googleConfigured = true
}

export async function signInWithGoogle(): Promise<AuthResult> {
  if (googleConfig === null) {
    return { ok: false, code: 'NOT_CONFIGURED', message: 'Google sign-in is not available yet.' }
  }
  ensureGoogleConfigured()
  await GoogleSignin.hasPlayServices()
  const response = await GoogleSignin.signIn()
  const idToken = response.data?.idToken
  if (idToken == null || idToken.length === 0) {
    return { ok: false, code: 'NO_ID_TOKEN', message: 'Google did not return a sign-in token.' }
  }
  const { error } = await authClient.signIn.social({ provider: 'google', idToken: { token: idToken } })
  return error ? { ok: false, code: error.code ?? 'UNKNOWN', message: 'Google sign-in failed.' } : { ok: true }
}

export async function signInWithApple(): Promise<AuthResult> {
  if (appleConfig === null) {
    return { ok: false, code: 'NOT_CONFIGURED', message: 'Apple sign-in is not available yet.' }
  }
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  })
  const idToken = credential.identityToken
  if (idToken == null || idToken.length === 0) {
    return { ok: false, code: 'NO_ID_TOKEN', message: 'Apple did not return a sign-in token.' }
  }
  const { error } = await authClient.signIn.social({ provider: 'apple', idToken: { token: idToken } })
  return error ? { ok: false, code: error.code ?? 'UNKNOWN', message: 'Apple sign-in failed.' } : { ok: true }
}
