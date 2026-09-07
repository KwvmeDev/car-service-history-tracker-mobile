import type { Middleware } from 'openapi-fetch'

import { getSessionToken } from './session-store'

/**
 * openapi-fetch middleware that attaches the Better Auth session as a bearer token
 * (ADR 0003 — mobile carries the session as a bearer from SecureStore; revv-api's
 * `bearer()` plugin resolves it).
 *
 * Guardrails (security-guard, subtask 13):
 *  - the token is read only from `session-store` (SecureStore), never cached here;
 *  - it is attached ONLY to same-origin revv-api requests, never to an arbitrary URL
 *    the app might fetch (e.g. an image CDN, NHTSA);
 *  - a request without a session still goes out — public routes must keep working.
 */

export type TokenReader = () => Promise<string | null>

export interface AuthMiddlewareOptions {
  /** revv-api origin; requests to any other origin get no Authorization header. */
  apiOrigin: string
  /** Override the token source (tests). Defaults to the SecureStore reader. */
  readToken?: TokenReader
}

function sameOrigin(requestUrl: string, apiOrigin: string): boolean {
  try {
    return new URL(requestUrl).origin === new URL(apiOrigin).origin
  } catch {
    return false
  }
}

export function createAuthMiddleware(options: AuthMiddlewareOptions): Middleware {
  const readToken = options.readToken ?? getSessionToken

  return {
    onRequest: async ({ request }) => {
      if (!sameOrigin(request.url, options.apiOrigin)) {
        return undefined
      }
      if (request.headers.has('Authorization')) {
        return undefined
      }

      const token = await readToken()
      if (token === null || token.length === 0) {
        return undefined
      }

      request.headers.set('Authorization', `Bearer ${token}`)
      return request
    },
  }
}
