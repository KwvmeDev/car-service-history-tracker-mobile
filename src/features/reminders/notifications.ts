import * as Notifications from 'expo-notifications'
import { MMKV } from 'react-native-mmkv'

import type { Reminder } from './types'

/**
 * Local reminder notifications (Sprint 4). When a reminder crosses into `due` or
 * `overdue` the app fires a one-off local notification for it — once per crossing,
 * not on every refetch. Server-driven push for reminders coming up days ahead is
 * Sprint 8; this is the on-device signal for "it's due now".
 *
 * `expo-notifications` has no web build we can use, so this whole module is
 * platform-split: `notifications.web.ts` is a set of no-ops and is what the Expo
 * Router web preview resolves. Keep the two signatures in step.
 */

const store = new MMKV({ id: 'revv-reminder-notifications' })
/** ids we've already notified for and haven't seen return to `ok`. */
const NOTIFIED_KEY = 'notified'
const notificationId = (reminderId: string): string => `revv-reminder-${reminderId}`

let handlerConfigured = false
let permissionGranted: boolean | null = null

/** Call once at app start. Safe to call more than once. */
export function configureReminderNotifications(): void {
  if (handlerConfigured) return
  handlerConfigured = true
  Notifications.setNotificationHandler({
    handleNotification: () =>
      Promise.resolve({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
  })
}

async function ensurePermission(): Promise<boolean> {
  if (permissionGranted != null) return permissionGranted
  const existing = await Notifications.getPermissionsAsync()
  const granted = existing.granted
    ? true
    : (await Notifications.requestPermissionsAsync()).granted
  permissionGranted = granted
  return granted
}

function readNotified(): Set<string> {
  const raw = store.getString(NOTIFIED_KEY)
  if (raw == null) return new Set()
  try {
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

function writeNotified(ids: Set<string>): void {
  store.set(NOTIFIED_KEY, JSON.stringify([...ids]))
}

/**
 * Reconcile notifications against the current reminder list for a vehicle:
 *  - a reminder that is now `due`/`overdue` and hasn't been notified → fire one, remember it
 *  - a reminder back to `ok` → forget it (so the next crossing notifies again) and
 *    cancel any pending notification
 */
export async function syncReminderNotifications(
  vehicleLabel: string,
  reminders: Reminder[],
): Promise<void> {
  if (reminders.length === 0) return
  if (!(await ensurePermission())) return

  const notified = readNotified()
  let changed = false

  for (const reminder of reminders) {
    const attentionNeeded = reminder.status === 'due' || reminder.status === 'overdue'
    const already = notified.has(reminder.id)

    if (attentionNeeded && !already) {
      await Notifications.scheduleNotificationAsync({
        identifier: notificationId(reminder.id),
        content: {
          title:
            reminder.status === 'overdue'
              ? `${reminder.title} is overdue`
              : `${reminder.title} is coming up`,
          body: `${vehicleLabel} · ${describeDue(reminder)}`,
        },
        trigger: null,
      })
      notified.add(reminder.id)
      changed = true
    } else if (!attentionNeeded && already) {
      await Notifications.cancelScheduledNotificationAsync(notificationId(reminder.id)).catch(
        () => undefined,
      )
      notified.delete(reminder.id)
      changed = true
    }
  }

  if (changed) writeNotified(notified)
}

/** Drop everything a set of reminders owned — used when a vehicle is deleted. */
export async function clearReminderNotifications(reminderIds: string[]): Promise<void> {
  const notified = readNotified()
  for (const id of reminderIds) {
    if (notified.delete(id)) {
      await Notifications.cancelScheduledNotificationAsync(notificationId(id)).catch(() => undefined)
    }
  }
  writeNotified(notified)
}

function describeDue(reminder: Reminder): string {
  if (reminder.milesRemaining != null && reminder.milesRemaining < 0) {
    return `overdue by ${Math.abs(reminder.milesRemaining).toLocaleString('en-US')} mi`
  }
  if (reminder.milesRemaining != null) {
    return `due in ${reminder.milesRemaining.toLocaleString('en-US')} mi`
  }
  if (reminder.daysRemaining != null && reminder.daysRemaining < 0) {
    return `overdue by ${String(Math.abs(reminder.daysRemaining))} days`
  }
  if (reminder.daysRemaining != null) return `due in ${String(reminder.daysRemaining)} days`
  return 'due soon'
}
