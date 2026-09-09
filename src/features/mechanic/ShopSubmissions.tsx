import { StyleSheet, View } from 'react-native'
import { borderWidth, color, radius, space } from '@revv/tokens'

import { AppText, Button, ErrorState } from '@/ui'
import { useServiceTypes } from '@/features/service-records/use-service-types'

import { useAcceptSubmission, useMechanicSubmissions, useRejectSubmission } from './hooks'
import type { MechanicSubmission } from './types'

function money(minor: number | null, currency: string | null): string | null {
  if (minor == null) return null
  return `${currency ?? 'USD'} ${(minor / 100).toFixed(2)}`
}

/**
 * The owner's review queue for one vehicle (Sprint 11, ADR 0015). Each pending
 * shop submission shows its fields and Accept / Reject. Accept mints a real
 * service record (server-side, with the mileage rollup); reject drops it.
 * Renders nothing when the queue is empty and not loading.
 */
export function ShopSubmissions({ vehicleId }: { vehicleId: string }) {
  const queue = useMechanicSubmissions(vehicleId)
  const types = useServiceTypes()
  const accept = useAcceptSubmission(vehicleId)
  const reject = useRejectSubmission(vehicleId)

  const rows = queue.data ?? []
  const typeLabel = (key: string): string =>
    types.data?.find((t) => t.key === key)?.label ?? key.replace(/_/g, ' ')

  if (queue.isError) {
    return (
      <View style={styles.wrap}>
        <ErrorState message="We couldn't load shop submissions." onRetry={() => void queue.refetch()} />
      </View>
    )
  }
  if (rows.length === 0) return null

  return (
    <View style={styles.wrap}>
      <AppText token="label" tone="secondary">
        From shops · {rows.length} to review
      </AppText>
      {rows.map((s) => (
        <SubmissionRow
          key={s.id}
          submission={s}
          typeLabel={typeLabel(s.serviceTypeKey)}
          cost={money(s.costMinor, s.costCurrency)}
          busy={accept.isPending || reject.isPending}
          onAccept={() => {
            accept.mutate(s.id)
          }}
          onReject={() => {
            reject.mutate(s.id)
          }}
        />
      ))}
    </View>
  )
}

interface RowProps {
  submission: MechanicSubmission
  typeLabel: string
  cost: string | null
  busy: boolean
  onAccept: () => void
  onReject: () => void
}

function SubmissionRow({ submission: s, typeLabel, cost, busy, onAccept, onReject }: RowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowHead}>
        <AppText token="body" weight="medium">
          {typeLabel}
        </AppText>
        {s.mileage != null ? (
          <AppText token="mono" tone="secondary">
            {s.mileage.toLocaleString('en-US')}
          </AppText>
        ) : null}
      </View>
      <AppText token="caption" tone="secondary">
        {s.performedOn} · {s.shopName}
        {cost != null ? ` · ${cost}` : ''}
      </AppText>
      {s.notes != null ? (
        <AppText token="caption" tone="secondary">
          {s.notes}
        </AppText>
      ) : null}
      <View style={styles.actions}>
        <Button label="Add to record" variant="secondary" loading={busy} onPress={onAccept} />
        <Button label="Reject" variant="text" onPress={onReject} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  row: {
    gap: space.xxs,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: borderWidth.thin,
    borderColor: color.hairline,
  },
  rowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.xs },
})
