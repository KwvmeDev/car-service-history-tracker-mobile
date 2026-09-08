import { api } from '@/api/client'
import { unwrap } from '@/api/errors'

import type { RegisterPushTokenBody } from './types'

/** Thin transport — one call each, no logic (engineering-standards.md §Layering). */

export async function registerPushToken(body: RegisterPushTokenBody): Promise<void> {
  unwrap(await api.POST('/v1/push-tokens', { body }))
}

export async function unregisterPushToken(token: string): Promise<void> {
  unwrap(await api.DELETE('/v1/push-tokens/{token}', { params: { path: { token } } }))
}
