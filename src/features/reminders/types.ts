import type { paths } from '@/api/client'

/** A reminder exactly as revv-api returns it, computed `status` included. */
export type Reminder =
  paths['/v1/reminders/{id}']['get']['responses']['200']['content']['application/json']

export type ReminderStatus = Reminder['status']

/** Body for POST /v1/vehicles/{vehicleId}/reminders — the client supplies `id`. */
export type CreateReminderBody =
  paths['/v1/vehicles/{vehicleId}/reminders']['post']['requestBody']['content']['application/json']

export type PatchReminderBody = NonNullable<
  paths['/v1/reminders/{id}']['patch']['requestBody']
>['content']['application/json']
