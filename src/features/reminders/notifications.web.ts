import type { Reminder } from './types'

/**
 * Web has no `expo-notifications` build we use (and importing it breaks the Metro
 * web bundle), so the reminder-notification surface is a set of no-ops here. The
 * Expo Router web target is a preview; local notifications are a device feature.
 * Keep these signatures in step with `notifications.ts`.
 */

export function configureReminderNotifications(): void {
  // no-op on web
}

export function syncReminderNotifications(
  _vehicleLabel: string,
  _reminders: Reminder[],
): Promise<void> {
  return Promise.resolve()
}

export function clearReminderNotifications(_reminderIds: string[]): Promise<void> {
  return Promise.resolve()
}
