import { api } from '@/api/client'
import { unwrap } from '@/api/errors'

import type { NotificationPreferences, NotificationPreferencesPatch } from './types'

/** Thin transport — one call each, no logic (engineering-standards.md §Layering). */

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  return unwrap(await api.GET('/v1/notification-preferences'))
}

export async function updateNotificationPreferences(
  patch: NotificationPreferencesPatch,
): Promise<NotificationPreferences> {
  return unwrap(await api.PATCH('/v1/notification-preferences', { body: patch }))
}
