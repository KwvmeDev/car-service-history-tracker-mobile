import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { color, radius, space } from '@revv/tokens'

import { AppText, Button, Field, Sheet } from '@/ui'
import { newId } from '@/data/ids'
import { AttachmentGallery } from '@/features/attachments/AttachmentGallery'

import { useLogServiceRecord, useUpdateServiceRecord } from './hooks'
import { useServiceTypes } from './use-service-types'
import type { ServiceRecord } from './types'

const today = (): string => new Date().toISOString().slice(0, 10)
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export interface LogServiceSheetProps {
  vehicleId: string
  visible: boolean
  onDismiss: () => void
  /** Present → editing that record instead of logging a new one. */
  record?: ServiceRecord
}

export function LogServiceSheet({ vehicleId, visible, onDismiss, record }: LogServiceSheetProps) {
  const types = useServiceTypes()
  const log = useLogServiceRecord(vehicleId)
  const update = useUpdateServiceRecord(vehicleId, record?.id ?? '')

  const [id] = useState(newId)
  const [typeKey, setTypeKey] = useState('oil_change')
  const [performedOn, setPerformedOn] = useState(today)
  const [mileage, setMileage] = useState('')
  const [cost, setCost] = useState('')
  const [shop, setShop] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!visible) return
    setTypeKey(record?.serviceTypeKey ?? 'oil_change')
    setPerformedOn(record?.performedOn ?? today())
    setMileage(record?.mileage != null ? String(record.mileage) : '')
    setCost(record?.costMinor != null ? (record.costMinor / 100).toString() : '')
    setShop(record?.shopName ?? '')
    setNotes(record?.notes ?? '')
  }, [visible, record])

  const dateValid = DATE_RE.test(performedOn)
  const options = useMemo(
    () => types.data ?? [{ key: 'oil_change', label: 'Oil change' }, { key: 'other', label: 'Other' }],
    [types.data],
  )

  const submit = () => {
    if (!dateValid) return
    const costMinor = cost.trim().length > 0 ? Math.round(Number(cost.replace(/[^0-9.]/g, '')) * 100) : null
    const common = {
      serviceTypeKey: typeKey,
      performedOn,
      mileage: mileage.trim().length > 0 ? Number(mileage.replace(/[^0-9]/g, '')) : null,
      costMinor,
      costCurrency: costMinor != null ? 'USD' : null,
      shopName: shop.trim().length > 0 ? shop.trim() : null,
      notes: notes.trim().length > 0 ? notes.trim() : null,
    }
    if (record) {
      update.mutate(common)
    } else {
      log.mutate({ id, ...common })
    }
    onDismiss()
  }

  return (
    <Sheet visible={visible} onDismiss={onDismiss} title={record ? 'Edit service' : 'Log a service'}>
      <ScrollView keyboardShouldPersistTaps="handled" style={styles.scroll}>
        <View style={styles.form}>
          <View style={styles.field}>
            <AppText token="label" tone="secondary">
              Type
            </AppText>
            <View style={styles.chips}>
              {options.map((opt) => (
                <Pressable
                  key={opt.key}
                  accessibilityRole="button"
                  onPress={() => {
                    setTypeKey(opt.key)
                  }}
                  style={[styles.chip, opt.key === typeKey ? styles.chipActive : undefined]}
                >
                  <AppText
                    token="label"
                    tone={opt.key === typeKey ? 'onNavy' : 'primary'}
                  >
                    {opt.label}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>

          <Field
            label="Date"
            value={performedOn}
            onChangeText={setPerformedOn}
            placeholder="YYYY-MM-DD"
            data
            error={!dateValid ? 'Use YYYY-MM-DD.' : undefined}
          />
          <Field
            label="Mileage"
            value={mileage}
            onChangeText={(t) => {
              setMileage(t.replace(/[^0-9]/g, ''))
            }}
            keyboardType="number-pad"
            data
          />
          <Field
            label="Cost"
            value={cost}
            onChangeText={(t) => {
              setCost(t.replace(/[^0-9.]/g, ''))
            }}
            keyboardType="decimal-pad"
            data
          />
          <Field label="Shop" value={shop} onChangeText={setShop} />
          <Field label="Notes" value={notes} onChangeText={setNotes} multiline />

          {record ? (
            <AttachmentGallery
              vehicleId={vehicleId}
              serviceRecordId={record.id}
              attachments={record.attachments}
            />
          ) : null}

          <Button label={record ? 'Save' : 'Log service'} block onPress={submit} />
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
  chipActive: { backgroundColor: color.navy, borderColor: color.navy },
})
