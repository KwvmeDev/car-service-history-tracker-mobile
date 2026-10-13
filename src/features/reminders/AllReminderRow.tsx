import type { WithPending } from '@/data/pending'

import { ReminderRow } from './ReminderRow'
import { useCompleteReminder, type ReminderWithVehicle } from './hooks'

/**
 * One row on the cross-vehicle Reminders tab. `useCompleteReminder` is bound to a
 * single vehicle, so each row (a different vehicle) needs its own instance — this
 * wrapper exists only to hold that per-row hook call.
 */
export function AllReminderRow({
  reminder,
  onPress,
}: {
  reminder: WithPending<ReminderWithVehicle>
  onPress: () => void
}) {
  const complete = useCompleteReminder(reminder.vehicleId)

  return (
    <ReminderRow
      reminder={reminder}
      vehicleTitle={reminder.vehicleTitle}
      onPress={onPress}
      onComplete={() => {
        complete.mutate(reminder.id)
      }}
    />
  )
}
