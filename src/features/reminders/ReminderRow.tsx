import { Pressable, StyleSheet, View } from 'react-native'
import { color, space } from '@revv/tokens'

import { AppText, Badge } from '@/ui'
import { isPending, type WithPending } from '@/data/pending'

import { intervalLabel, nextDueLabel, remainingLabel } from './format'
import type { Reminder } from './types'

export interface ReminderRowProps {
  reminder: WithPending<Reminder>
  onPress: () => void
  onComplete: () => void
}

/**
 * One reminder. The amber badge (Badge is the only component allowed amber —
 * design-system.md §Color law 2) carries the whole visual weight of "this needs
 * attention"; an `ok` reminder is quiet. "Mark done" drains it in place.
 *
 * The tap-to-edit target and "Mark done" are **siblings**, never nested — two
 * Pressables inside one another render `<button>` inside `<button>` on web.
 */
export function ReminderRow({ reminder, onPress, onComplete }: ReminderRowProps) {
  const pending = isPending(reminder)
  const attention = reminder.status === 'due' || reminder.status === 'overdue'

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit ${reminder.title}`}
        onPress={onPress}
        style={styles.body}
      >
        <View style={styles.titleLine}>
          <AppText token="heading" numberOfLines={1} style={styles.title}>
            {reminder.title}
          </AppText>
          {attention ? (
            <Badge
              label={reminder.status === 'overdue' ? 'Overdue' : 'Due soon'}
              status={reminder.status === 'overdue' ? 'overdue' : 'due'}
            />
          ) : pending ? (
            <Badge label="Not synced" status="due" />
          ) : null}
        </View>

        <AppText token="label" tone="secondary">
          {intervalLabel(reminder)}
        </AppText>

        <AppText
          token="caption"
          tone={attention ? 'attention' : 'secondary'}
          style={styles.remaining}
        >
          {attention ? remainingLabel(reminder) : (nextDueLabel(reminder) ?? 'On track')}
        </AppText>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Mark ${reminder.title} done`}
        onPress={onComplete}
        hitSlop={8}
        style={styles.done}
      >
        <AppText token="label" weight="semibold">
          Mark done
        </AppText>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.hairline,
    paddingVertical: space.sm,
  },
  body: { flex: 1, gap: space.xxs },
  title: { flex: 1 },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  remaining: { marginTop: space.xxs },
  done: { paddingTop: space.xxs },
})
