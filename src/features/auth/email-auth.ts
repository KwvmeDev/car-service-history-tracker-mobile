import { authClient, isTwoFactorChallengePending, setTwoFactorChallengePending } from './auth-client'

/**
 * Email + password auth (ADR 0003). Thin wrappers over the Better Auth client that
 * normalise `{ data, error }` into a discriminated result the screens switch on, and
 * turn the server's error `code` into human copy.
 */

export type AuthResult =
  | { ok: true }
  | { ok: false; message: string; code: string }

/** Sign-in can also land on a 2FA challenge (Sprint 8) before a session exists. */
export type SignInResult = AuthResult | { ok: true; twoFactorRequired: true }

interface BetterAuthError {
  code?: string
  message?: string
  status?: number
}

const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'That email or password is not right.',
  USER_ALREADY_EXISTS: 'There is already an account with that email.',
  EMAIL_NOT_VERIFIED: 'Verify your email address to continue.',
  PASSWORD_TOO_SHORT: 'Use a password of at least 8 characters.',
  TOO_MANY_REQUESTS: 'Too many attempts. Wait a minute and try again.',
}

function toResult(error: BetterAuthError | null | undefined): AuthResult {
  if (!error) return { ok: true }
  const code = error.code ?? 'UNKNOWN'
  return {
    ok: false,
    code,
    message: MESSAGES[code] ?? error.message ?? 'Something went wrong. Try again.',
  }
}

export async function signUpWithEmail(input: {
  name: string
  email: string
  password: string
}): Promise<AuthResult> {
  const { error } = await authClient.signUp.email({
    name: input.name,
    email: input.email,
    password: input.password,
  })
  return toResult(error)
}

export async function signInWithEmail(input: {
  email: string
  password: string
}): Promise<SignInResult> {
  setTwoFactorChallengePending(false)
  const { error } = await authClient.signIn.email({
    email: input.email,
    password: input.password,
  })
  if (!error && isTwoFactorChallengePending()) {
    return { ok: true, twoFactorRequired: true }
  }
  return toResult(error)
}

export async function resendVerification(email: string): Promise<AuthResult> {
  const { error } = await authClient.sendVerificationEmail({ email })
  return toResult(error)
}
