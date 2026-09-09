import { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { color, radius, space } from '@revv/tokens'

import { AppText, Button, Field, Sheet } from '@/ui'
import { newId } from '@/data/ids'
import { AttachmentGallery } from '@/features/attachments/AttachmentGallery'

import { useLogServiceRecord, useUpdateServiceRecord } from './hooks'
import type { ReceiptExtraction } from './receipt-ocr/parse-receipt'
import { reportOcrOutcome } from './receipt-ocr/telemetry'
import { useReceiptScan } from './receipt-ocr/use-receipt-scan'
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

interface FilledFromReceipt {
  costMinor: number | null
  performedOn: string | null
  shopName: string | null
  odometer: number | null
}

const NO_FILL: FilledFromReceipt = { costMinor: null, performedOn: null, shopName: null, odometer: null }

export function LogServiceSheet({ vehicleId, visible, onDismiss, record }: LogServiceSheetProps) {
  const types = useServiceTypes()
  const log = useLogServiceRecord(vehicleId)
  const update = useUpdateServiceRecord(vehicleId, record?.id ?? '')
  const scan = useReceiptScan()

  const [id] = useState(newId)
  const [typeKey, setTypeKey] = useState('oil_change')
  const [performedOn, setPerformedOn] = useState(today)
  const [mileage, setMileage] = useState('')
  const [cost, setCost] = useState('')
  const [shop, setShop] = useState('')
  const [notes, setNotes] = useState('')

  const scannedRef = useRef<ReceiptExtraction | null>(null)
  const filledRef = useRef<FilledFromReceipt>(NO_FILL)

  useEffect(() => {
    if (!visible) return
    setTypeKey(record?.serviceTypeKey ?? 'oil_change')
    setPerformedOn(record?.performedOn ?? today())
    setMileage(record?.mileage != null ? String(record.mileage) : '')
    setCost(record?.costMinor != null ? (record.costMinor / 100).toString() : '')
    setShop(record?.shopName ?? '')
    setNotes(record?.notes ?? '')
    scannedRef.current = null
    filledRef.current = NO_FILL
    scan.reset()
  }, [visible, record])

  // Pre-fill the empty fields from a completed scan (never overwrites what the
  // user already typed; the user still confirms and can edit everything).
  useEffect(() => {
    const ex = scan.extraction
    if (!ex) return
    scannedRef.current = ex
    const filled: FilledFromReceipt = { ...NO_FILL }
    if (ex.costMinor && cost.trim() === '') {
      setCost((ex.costMinor.value / 100).toString())
      filled.costMinor = ex.costMinor.value
    }
    if (ex.performedOn && (performedOn === '' || performedOn === today())) {
      setPerformedOn(ex.performedOn.value)
      filled.performedOn = ex.performedOn.value
    }
    if (ex.shopName && shop.trim() === '') {
      setShop(ex.shopName.value)
      filled.shopName = ex.shopName.value
    }
    if (ex.odometer && mileage.trim() === '') {
      setMileage(String(ex.odometer.value))
      filled.odometer = ex.odometer.value
    }
    filledRef.current = filled
  }, [scan.extraction])

  const dateValid = DATE_RE.test(performedOn)
  const options = useMemo(
    () => types.data ?? [{ key: 'oil_change', label: 'Oil change' }, { key: 'other', label: 'Other' }],
    [types.data],
  )

  const submit = () => {
    if (!dateValid) return
    const costMinor = cost.trim().length > 0 ? Math.round(Number(cost.replace(/[^0-9.]/g, '')) * 100) : null
    const mileageValue = mileage.trim().length > 0 ? Number(mileage.replace(/[^0-9]/g, '')) : null
    const shopName = shop.trim().length > 0 ? shop.trim() : null
    const common = {
      serviceTypeKey: typeKey,
      performedOn,
      mileage: mileageValue,
      costMinor,
      costCurrency: costMinor != null ? 'USD' : null,
      shopName,
      notes: notes.trim().length > 0 ? notes.trim() : null,
    }
    if (record) {
      update.mutate(common)
    } else {
      log.mutate({ id, ...common })
    }

    if (scannedRef.current) {
      void reportOcrOutcome(scannedRef.current, {
        filled: filledRef.current,
        saved: { costMinor, performedOn, shopName, odometer: mileageValue },
      })
    }
    onDismiss()
  }

  const scanBusy = scan.state === 'working'

  return (
    <Sheet visible={visible} onDismiss={onDismiss} title={record ? 'Edit service' : 'Log a service'}>
      <ScrollView keyboardShouldPersistTaps="handled" style={styles.scroll}>
        <View style={styles.form}>
          {!record && scan.state !== 'unsupported' ? (
            <View style={styles.scanRow}>
              <Button
                label={scanBusy ? 'Reading receipt…' : 'Scan a receipt'}
                variant="secondary"
                loading={scanBusy}
                onPress={() => void scan.scan('camera')}
              />
              <Button
                label="Choose a photo"
                variant="text"
                onPress={() => void scan.scan('library')}
              />
              {scan.state === 'done' ? (
                <AppText token="caption" tone="secondary">
                  Filled from your receipt — check each field before saving.
                </AppText>
              ) : null}
              {scan.state === 'error' ? (
                <AppText token="caption" tone="attention">
                  We couldn&apos;t read that receipt. Enter the details by hand.
                </AppText>
              ) : null}
            </View>
          ) : null}

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
                  <AppText token="label" tone={opt.key === typeKey ? 'onNavy' : 'primary'}>
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
  scanRow: { gap: space.xs },
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
