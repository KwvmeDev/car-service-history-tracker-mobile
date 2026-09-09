import { authClient } from '@/features/auth/auth-client'
import type { AuthResult } from '@/features/auth/email-auth'

/**
 * 2FA actions (Sprint 8) — thin wrappers over the Better Auth `twoFactor` client
 * that normalise `{ data, error }` into the discriminated result the screens
 * switch on, and map error codes to human copy. No toasts (design-system.md).
 */

interface BetterAuthError {
  code?: string
  message?: string
  status?: number
}

const MESSAGES: Record<string, string> = {
  INVALID_PASSWORD: 'That password is not right.',
  INVALID_EMAIL_OR_PASSWORD: 'That password is not right.',
  INVALID_CODE: 'That code is not right. Try again.',
  INVALID_BACKUP_CODE: 'That backup code is not right.',
  TOTP_NOT_ENABLED: 'Two-factor authentication is not set up on this account.',
  TWO_FACTOR_NOT_ENABLED: 'Two-factor authentication is not enabled.',
  TOTP_ALREADY_ENABLED: 'Two-factor authentication is already on.',
  ACCOUNT_TEMPORARILY_LOCKED: 'Too many attempts. Wait a few minutes and try again.',
  TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE: 'Too many attempts. Wait a few minutes and try again.',
}

function toResult(error: BetterAuthError | null | undefined): AuthResult {
  if (!error) return { ok: true }
  const code = error.code ?? 'UNKNOWN'
  return { ok: false, code, message: MESSAGES[code] ?? error.message ?? 'Something went wrong. Try again.' }
}

export interface TwoFactorEnrollment {
  /** `otpauth://totp/...` — the QR payload and the deep link into an authenticator app. */
  totpURI: string
  /** The base32 secret, for manual entry. */
  secret: string
  backupCodes: string[]
}

function secretFromUri(totpURI: string): string {
  try {
    return new URL(totpURI).searchParams.get('secret') ?? ''
  } catch {
    return ''
  }
}

export async function beginTwoFactorEnrollment(
  password: string,
): Promise<{ ok: true; enrollment: TwoFactorEnrollment } | { ok: false; message: string; code: string }> {
  const { data, error } = await authClient.twoFactor.enable({ password })
  const result = toResult(error)
  if (!result.ok) return result
  const enrollment = data as { totpURI?: string; backupCodes?: string[] } | null
  const totpURI = enrollment?.totpURI ?? ''
  return {
    ok: true,
    enrollment: {
      totpURI,
      secret: secretFromUri(totpURI),
      backupCodes: enrollment?.backupCodes ?? [],
    },
  }
}

/** Confirm enrollment with a live code (also used unchanged for the sign-in challenge). */
export async function verifyTotp(code: string): Promise<AuthResult> {
  const { error } = await authClient.twoFactor.verifyTotp({ code })
  return toResult(error)
}

export async function verifyBackupCode(code: string): Promise<AuthResult> {
  const { error } = await authClient.twoFactor.verifyBackupCode({ code })
  return toResult(error)
}

export async function disableTwoFactor(password: string): Promise<AuthResult> {
  const { error } = await authClient.twoFactor.disable({ password })
  return toResult(error)
}
