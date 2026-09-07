import { apiBaseUrl } from './base-url'
import { api } from './generated/client'
import { createAuthMiddleware } from '@/features/auth/auth-fetch-middleware'

/**
 * The app's one API entry point. `./generated/client` is regenerated from the pinned
 * OpenAPI document and must not be hand-edited (ADR 0005); this non-generated wrapper
 * is where cross-cutting request behaviour is attached.
 *
 * Here: the Better Auth bearer middleware (ADR 0003). It reads the session from
 * SecureStore and adds `Authorization: Bearer <token>` to same-origin revv-api
 * requests only. Public routes still work without a session.
 *
 * Import `{ api }` from here, never from `./generated/client` directly.
 */
api.use(createAuthMiddleware({ apiOrigin: apiBaseUrl }))

export { api }
export type { paths } from './generated/client'
