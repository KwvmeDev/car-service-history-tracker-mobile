import { useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import { space } from '@revv/tokens'

import { AppText, Button, ErrorState, Skeleton } from '@/ui'

import { TimelineEntry } from './TimelineEntry'
import { useServiceRecords } from './hooks'
import { useServiceTypes } from './use-service-types'

export interface TimelineProps {
  vehicleId: string
  onAddPress: () => void
  onEntryPress: (recordId: string) => void
}

/**
 * The vehicle profile's service history. Four states; the entries **stamp in once**
 * on the first load and then just render (design-system.md §Motion rule 4).
 */
export function Timeline({ vehicleId, onAddPress, onEntryPress }: TimelineProps) {
  const records = useServiceRecords(vehicleId)
  const types = useServiceTypes()

  // Stamp-in is a one-time thing: after the list has painted once, later renders
  // (a new optimistic entry, a refetch) don't re-animate the whole list.
  const hasStamped = useRef(false)
  const animateIn = !hasStamped.current
  if (records.data) hasStamped.current = true

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <AppText token="label" tone="secondary">
          Service history
        </AppText>
        {records.data && records.data.length > 0 ? (
          <Button label="Log a service" variant="text" onPress={onAddPress} />
        ) : null}
      </View>

      {records.isLoading ? (
        <View style={styles.skeletons}>
          <Skeleton width="70%" height={16} />
          <Skeleton width="50%" height={12} />
          <Skeleton width="60%" height={16} />
        </View>
      ) : records.isError ? (
        <ErrorState message="We couldn't load this history." onRetry={() => void records.refetch()} />
      ) : (records.data ?? []).length === 0 ? (
        <View style={styles.empty}>
          <AppText token="body" tone="secondary" style={styles.emptyText}>
            No services logged yet. The first entry starts the record.
          </AppText>
          <Button label="Log a service" onPress={onAddPress} />
        </View>
      ) : (
        <View>
          {(records.data ?? []).map((record, index) => (
            <TimelineEntry
              key={record.id}
              record={record}
              types={types.data}
              index={index}
              animateIn={animateIn}
              onPress={() => {
                onEntryPress(record.id)
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
