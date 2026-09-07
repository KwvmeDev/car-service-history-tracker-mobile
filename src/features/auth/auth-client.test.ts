import * as SecureStore from 'expo-secure-store'

import { createAuthMiddleware } from './auth-fetch-middleware'
import * as sessionStore from './session-store'
import { toSessionState } from './use-session'

const { AUTH_STORAGE_PREFIX, clearStoredSession, extractSessionToken, getSessionToken } = sessionStore

const API_ORIGIN = 'http://localhost:3000'
const COOKIE_KEY = `${AUTH_STORAGE_PREFIX}_cookie`

function cookieMap(token: string, expires?: string): string {
  return JSON.stringify({ 'better-auth.session_token': { value: token, ...(expires ? { expires } : {}) } })
}

async function runOnRequest(url: string, readToken: () => Promise<string | null>): Promise<Request> {
  const middleware = createAuthMiddleware({ apiOrigin: API_ORIGIN, readToken })
  const request = new Request(url)
  const result = await middleware.onRequest?.({
    request,
    schemaPath: '/v1/vehicles',
    params: {},
    id: '1',
    options: {} as never,
  })
  return result instanceof Request ? result : request
}

describe('auth fetch middleware', () => {
  it('attaches the stored session as a bearer header on a revv-api request', async () => {
    const out = await runOnRequest(`${API_ORIGIN}/v1/vehicles`, () => Promise.resolve('sess-abc'))

    expect(out.headers.get('Authorization')).toBe('Bearer sess-abc')
  })

  it('does NOT attach the bearer to a non-revv-api origin', async () => {
    const readToken = jest.fn(() => Promise.resolve('sess-abc'))

    const out = await runOnRequest('https://vpic.nhtsa.dot.gov/api/x', readToken)

    expect(out.headers.get('Authorization')).toBeNull()
    expect(readToken).not.toHaveBeenCalled()
  })

  it('sends the request unauthenticated when there is no session (public routes)', async () => {
    const out = await runOnRequest(`${API_ORIGIN}/v1/health`, () => Promise.resolve(null))

    expect(out.headers.get('Authorization')).toBeNull()
  })
})

describe('extractSessionToken', () => {
  it('returns the token value from the persisted cookie map', () => {
    expect(extractSessionToken(cookieMap('tok-1'))).toBe('tok-1')
  })

  it('ignores an expired session cookie', () => {
    const past = new Date(Date.now() - 1000).toISOString()
    expect(extractSessionToken(cookieMap('tok-1', past))).toBeNull()
  })

  it('returns null for an empty, missing, or malformed store value', () => {
    expect(extractSessionToken(null)).toBeNull()
    expect(extractSessionToken('')).toBeNull()
    expect(extractSessionToken('not json')).toBeNull()
    expect(extractSessionToken('{}')).toBeNull()
  })
})

describe('session store', () => {
  it('reads the token only from expo-secure-store', async () => {
    await SecureStore.setItemAsync(COOKIE_KEY, cookieMap('tok-secure'))

    await expect(getSessionToken()).resolves.toBe('tok-secure')
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith(COOKIE_KEY, expect.anything())
  })

  it('clearStoredSession removes the cookie and session-data entries', async () => {
    await SecureStore.setItemAsync(COOKIE_KEY, cookieMap('tok'))
    await SecureStore.setItemAsync(`${AUTH_STORAGE_PREFIX}_session_data`, '{"user":{}}')

    await clearStoredSession()

    await expect(getSessionToken()).resolves.toBeNull()
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(COOKIE_KEY, expect.anything())
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
      `${AUTH_STORAGE_PREFIX}_session_data`,
      expect.anything(),
    )
  })
})

describe('toSessionState', () => {
  it('maps a session with a user to authenticated', () => {
    const state = toSessionState({
      data: { user: { id: 'u1', email: 'a@b.co', name: 'A', emailVerified: true } },
      isPending: false,
    })

    expect(state).toEqual({
      status: 'authenticated',
      user: { id: 'u1', email: 'a@b.co', name: 'A', emailVerified: true },
    })
  })

  it('maps a pending session with no data to loading', () => {
    expect(toSessionState({ data: null, isPending: true }).status).toBe('loading')
  })

  it('maps a settled session with no user to unauthenticated', () => {
    expect(toSessionState({ data: null, isPending: false }).status).toBe('unauthenticated')
  })
})
