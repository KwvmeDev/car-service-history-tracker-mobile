import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { color, radius, space } from '@revv/tokens'

import { AppText, Button, Field, Sheet } from '@/ui'
import { newId } from '@/data/ids'
import { useServiceTypes } from '@/features/service-records/use-service-types'

import { useCompleteReminder, useCreateReminder, useDeleteReminder, useUpdateReminder } from './hooks'
import type { Reminder } from './types'

export interface ReminderSheetProps {
  vehicleId: string
  visible: boolean
  onDismiss: () => void
  /** Present → editing that reminder instead of creating one. */
  reminder?: Reminder
}

const digits = (t: string): string => t.replace(/[^0-9]/g, '')

export function ReminderSheet({ vehicleId, visible, onDismiss, reminder }: ReminderSheetProps) {
  const types = useServiceTypes()
  const create = useCreateReminder(vehicleId)
  const update = useUpdateReminder(vehicleId, reminder?.id ?? '')
  const complete = useCompleteReminder(vehicleId)
  const remove = useDeleteReminder(vehicleId)

  const [id] = useState(newId)
  const [title, setTitle] = useState('')
  const [typeKey, setTypeKey] = useState<string | null>(null)
  const [miles, setMiles] = useState('')
  const [months, setMonths] = useState('')

  useEffect(() => {
    if (!visible) return
    setTitle(reminder?.title ?? '')
    setTypeKey(reminder?.serviceTypeKey ?? null)
    setMiles(reminder?.intervalMiles != null ? String(reminder.intervalMiles) : '')
    setMonths(reminder?.intervalMonths != null ? String(reminder.intervalMonths) : '')
  }, [visible, reminder])

  const intervalMiles = miles.trim().length > 0 ? Number(miles) : null
  const intervalMonths = months.trim().length > 0 ? Number(months) : null
  const hasInterval = intervalMiles != null || intervalMonths != null
  const canSave = title.trim().length > 0 && hasInterval

  const submit = () => {
    if (!canSave) return
    const common = {
      title: title.trim(),
      serviceTypeKey: typeKey,
      intervalMiles,
      intervalMonths,
    }
    if (reminder) {
      update.mutate(common)
    } else {
      create.mutate({ id, ...common })
    }
    onDismiss()
  }

  return (
    <Sheet
      visible={visible}
      onDismiss={onDismiss}
      title={reminder ? 'Edit reminder' : 'New reminder'}
    >
      <ScrollView keyboardShouldPersistTaps="handled" style={styles.scroll}>
        <View style={styles.form}>
          <Field label="Name" value={title} onChangeText={setTitle} placeholder="Oil change" />

          <View style={styles.field}>
            <AppText token="label" tone="secondary">
              Type (optional)
            </AppText>
            <View style={styles.chips}>
              {(types.data ?? []).map((opt) => {
                const active = opt.key === typeKey
                return (
                  <Pressable
                    key={opt.key}
                    accessibilityRole="button"
                    onPress={() => {
                      setTypeKey(active ? null : opt.key)
                    }}
                    style={[styles.chip, active ? styles.chipActive : undefined]}
                  >
                    <AppText token="label" tone={active ? 'onBlue' : 'primary'}>
                      {opt.label}
                    </AppText>
                  </Pressable>
                )
              })}
            </View>
          </View>

          <Field
            label="Every … miles"
            value={miles}
            onChangeText={(t) => {
              setMiles(digits(t))
            }}
            keyboardType="number-pad"
            placeholder="5000"
            data
          />
          <Field
            label="Every … months"
            value={months}
            onChangeText={(t) => {
              setMonths(digits(t))
            }}
            keyboardType="number-pad"
            placeholder="6"
            data
            error={!hasInterval && (title.trim().length > 0 || miles.length > 0 || months.length > 0)
              ? 'Set an interval in miles, months, or both.'
              : undefined}
          />

          <Button
            label={reminder ? 'Save' : 'Add reminder'}
            block
            disabled={!canSave}
            onPress={submit}
          />

          {reminder ? (
            <View style={styles.editActions}>
              <Button
                label="Mark done"
                variant="secondary"
                onPress={() => {
                  complete.mutate(reminder.id)
                  onDismiss()
                }}
              />
              <Button
                label="Delete"
                variant="text"
                onPress={() => {
                  remove.mutate(reminder.id)
                  onDismiss()
                }}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </Sheet>
  )
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 460 },
  form: { gap: space.md },
  field: { gap: space.xxs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  chip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: color.hairline,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  chipActive: { backgroundColor: color.blue, borderColor: color.blue },
  editActions: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
})
