import { StyleSheet, View } from 'react-native'
import { space } from '@revv/tokens'

import { AppText, Button, ErrorState, Skeleton } from '@/ui'

import { ReminderRow } from './ReminderRow'
import { useCompleteReminder, useReminders } from './hooks'
import { attentionRank } from './status'

export interface RemindersProps {
  vehicleId: string
  onAddPress: () => void
  onEditPress: (reminderId: string) => void
}

/**
 * The vehicle profile's reminders section. Four states, mirroring the timeline.
 * Overdue/due reminders sort to the top so attention is where the eye lands first.
 */
export function Reminders({ vehicleId, onAddPress, onEditPress }: RemindersProps) {
  const reminders = useReminders(vehicleId)
  const complete = useCompleteReminder(vehicleId)

  const rows = [...(reminders.data ?? [])].sort(
    (a, b) => attentionRank(b.status) - attentionRank(a.status),
  )

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <AppText token="label" tone="secondary">
          Reminders
        </AppText>
        {rows.length > 0 ? (
          <Button label="Add a reminder" variant="text" onPress={onAddPress} />
        ) : null}
      </View>

      {reminders.isLoading ? (
        <View style={styles.skeletons}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} />
        </View>
      ) : reminders.isError ? (
        <ErrorState
          message="We couldn't load reminders."
          onRetry={() => void reminders.refetch()}
        />
      ) : rows.length === 0 ? (
        <View style={styles.empty}>
          <AppText token="body" tone="secondary" style={styles.emptyText}>
            No reminders yet. Set one so you know when the next service is due.
          </AppText>
          <Button label="Add a reminder" onPress={onAddPress} />
        </View>
      ) : (
        <View>
          {rows.map((reminder) => (
            <ReminderRow
              key={reminder.id}
              reminder={reminder}
              onPress={() => {
                onEditPress(reminder.id)
              }}
              onComplete={() => {
                complete.mutate(reminder.id)
              }}
            />
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skeletons: { gap: space.sm, paddingVertical: space.sm },
  empty: { gap: space.md, alignItems: 'center', paddingVertical: space.lg },
  emptyText: { textAlign: 'center' },
})
