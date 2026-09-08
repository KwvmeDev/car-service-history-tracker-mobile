import { useEffect } from 'react'

import { useReminders } from './hooks'
import { syncReminderNotifications } from './notifications'

/**
 * Keeps local notifications in step with a vehicle's reminder list: when a reminder
 * crosses into `due` / `overdue` a one-off notification fires (once per crossing).
 * Mount it on the vehicle profile. No-op on web.
 */
export function useReminderNotifications(vehicleId: string, vehicleLabel: string): void {
  const { data } = useReminders(vehicleId)

  useEffect(() => {
    if (!data) return
    void syncReminderNotifications(vehicleLabel, data)
  }, [data, vehicleLabel])
}
