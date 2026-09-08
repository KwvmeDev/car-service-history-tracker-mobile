import { authClient } from './auth-client'
import { signInWithEmail, signUpWithEmail } from './email-auth'

jest.mock('./auth-client', () => ({
  authClient: {
    signIn: { email: jest.fn() },
    signUp: { email: jest.fn() },
  },
}))

const mockClient = authClient as unknown as {
  signIn: { email: jest.Mock }
  signUp: { email: jest.Mock }
}

describe('email auth result mapping', () => {
  it('returns ok on a clean sign-in', async () => {
    mockClient.signIn.email.mockResolvedValue({ data: {}, error: null })
    await expect(signInWithEmail({ email: 'a@b.com', password: 'x' })).resolves.toEqual({ ok: true })
  })

  it('maps a known error code to human copy', async () => {
    mockClient.signIn.email.mockResolvedValue({
      data: null,
      error: { code: 'INVALID_EMAIL_OR_PASSWORD' },
    })
    const result = await signInWithEmail({ email: 'a@b.com', password: 'x' })
    expect(result).toEqual({
      ok: false,
      code: 'INVALID_EMAIL_OR_PASSWORD',
      message: 'That email or password is not right.',
    })
  })

  it('falls back to the server message for an unknown code', async () => {
    mockClient.signUp.email.mockResolvedValue({
      data: null,
      error: { code: 'WEIRD', message: 'the server said no' },
    })
    const result = await signUpWithEmail({ name: 'A', email: 'a@b.com', password: 'longenough' })
    expect(result).toMatchObject({ ok: false, message: 'the server said no' })
  })
})
