import { ScrollView, StyleSheet, View } from 'react-native'
import { color, space } from '@revv/tokens'

import { AppText, Button, ErrorState, Sheet, Skeleton } from '@/ui'

import { reportDate, reportStatusLabel } from './format'
import { useRevokeReport, useVehicleReports } from './hooks'
import type { ResaleReport } from './types'

export interface ReportsSheetProps {
  vehicleId: string
  visible: boolean
  onDismiss: () => void
  onGenerate: () => void
  onRegenerate: (reportId: string) => void
}

/**
 * Manage a vehicle's resale reports — the newest is the one that matters; older ones
 * are history. Revoke kills a link immediately; regenerate revokes and mints a fresh
 * one (through the theatrical flow).
 */
export function ReportsSheet({
  vehicleId,
  visible,
  onDismiss,
  onGenerate,
  onRegenerate,
}: ReportsSheetProps) {
  const reports = useVehicleReports(vehicleId, visible)
  const revoke = useRevokeReport(vehicleId)

  const rows = reports.data ?? []
  const current = rows.find((r) => r.status === 'active')

  return (
    <Sheet visible={visible} onDismiss={onDismiss} title="Resale reports">
      <ScrollView style={styles.scroll}>
        <View style={styles.body}>
          {reports.isLoading ? (
            <View style={styles.skeletons}>
              <Skeleton width="60%" height={16} />
              <Skeleton width="40%" height={12} />
            </View>
          ) : reports.isError ? (
            <ErrorState message="We couldn't load your reports." onRetry={() => void reports.refetch()} />
          ) : rows.length === 0 ? (
            <View style={styles.empty}>
              <AppText token="body" tone="secondary" style={styles.emptyText}>
                No reports yet. Generate one when you&rsquo;re ready to sell — it turns the whole
                history into a document a buyer can open.
              </AppText>
              <Button label="Generate resale report" onPress={onGenerate} />
            </View>
          ) : (
            <>
              {rows.map((report) => (
                <ReportRow
                  key={report.id}
                  report={report}
                  onRevoke={() => {
                    revoke.mutate(report.id)
                  }}
                  onRegenerate={() => {
                    onRegenerate(report.id)
                  }}
                />
              ))}
              {current == null ? (
                <Button label="Generate a new report" onPress={onGenerate} />
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </Sheet>
  )
}

function ReportRow({
  report,
  onRevoke,
  onRegenerate,
}: {
  report: ResaleReport
  onRevoke: () => void
  onRegenerate: () => void
}) {
  const revoked = report.status === 'revoked'
  return (
    <View style={[styles.row, revoked ? styles.rowRevoked : undefined]}>
      <View style={styles.rowMain}>
        <AppText token="heading">{reportDate(report.generatedAt)}</AppText>
        <AppText token="label" tone="secondary">
          {reportStatusLabel(report)}
        </AppText>
      </View>
      {revoked ? null : (
        <View style={styles.rowActions}>
          <Button label="Replace" variant="text" onPress={onRegenerate} />
          <Button label="Revoke" variant="text" onPress={onRevoke} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 440 },
  body: { gap: space.md },
  skeletons: { gap: space.sm, paddingVertical: space.sm },
  empty: { gap: space.md, alignItems: 'center', paddingVertical: space.lg },
  emptyText: { textAlign: 'center' },
  row: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.hairline,
    paddingVertical: space.sm,
    gap: space.xs,
  },
  rowRevoked: { opacity: 0.5 },
  rowMain: { gap: space.xxs },
  rowActions: { flexDirection: 'row', gap: space.md },
})
