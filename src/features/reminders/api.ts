import { api } from '@/api/client'
import { unwrap } from '@/api/errors'

import type { CreateReminderBody, PatchReminderBody, Reminder } from './types'

/** Thin transport — one call each, no logic (engineering-standards.md §Layering). */

export async function listReminders(vehicleId: string): Promise<Reminder[]> {
  const page = unwrap(
    await api.GET('/v1/vehicles/{vehicleId}/reminders', {
      params: { path: { vehicleId }, query: { limit: 100 } },
    }),
  )
  return page.data
}

export async function getReminder(id: string): Promise<Reminder> {
  return unwrap(await api.GET('/v1/reminders/{id}', { params: { path: { id } } }))
}

export async function createReminder(
  vehicleId: string,
  body: CreateReminderBody,
): Promise<Reminder> {
  return unwrap(
    await api.POST('/v1/vehicles/{vehicleId}/reminders', {
      params: { path: { vehicleId } },
      body,
    }),
  )
}

export async function patchReminder(id: string, body: PatchReminderBody): Promise<Reminder> {
  return unwrap(await api.PATCH('/v1/reminders/{id}', { params: { path: { id } }, body }))
}

export async function deleteReminder(id: string): Promise<void> {
  unwrap(await api.DELETE('/v1/reminders/{id}', { params: { path: { id } } }))
}
