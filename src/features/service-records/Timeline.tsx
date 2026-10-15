import { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { color, radius, space } from '@revv/tokens'

import { AppText, Button, ErrorState, Skeleton } from '@/ui'

import { TimelineEntry } from './TimelineEntry'
import { TimelineFilters } from './TimelineFilters'
import { useServiceRecords } from './hooks'
import { hasActiveFilter, type TimelineFilter } from './types'
import { useServiceTypes } from './use-service-types'

export interface TimelineProps {
  vehicleId: string
  onAddPress: () => void
  onEntryPress: (recordId: string) => void
}

const SEARCH_DEBOUNCE_MS = 300

/**
 * The vehicle profile's service history. Four states; the entries **stamp in once**
 * on the first load and then just render (design-system.md §Motion rule 4). Search /
 * type / date-range filters (Sprint 8) sit above the list; a filtered-empty result
 * gets its own copy, distinct from the no-records-yet empty state.
 */
export function Timeline({ vehicleId, onAddPress, onEntryPress }: TimelineProps) {
  // `input` is what the controls show; `filter` is what the query runs (debounced q).
  const [input, setInput] = useState<TimelineFilter>({})
  const [filter, setFilter] = useState<TimelineFilter>({})

  useEffect(() => {
    const id = setTimeout(() => {
      setFilter(input)
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      clearTimeout(id)
    }
  }, [input])

  const records = useServiceRecords(vehicleId, filter)
  const types = useServiceTypes()
  const filtering = hasActiveFilter(input)

  // Stamp-in is a one-time thing on the very first unfiltered load.
  const hasStamped = useRef(false)
  const animateIn = !hasStamped.current && !filtering
  if (records.data && !filtering) hasStamped.current = true

  const rows = useMemo(() => records.data ?? [], [records.data])

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <AppText token="label" tone="secondary">
          Service history
        </AppText>
        {rows.length > 0 || filtering ? (
          <View style={styles.headerActions}>
            <Button label="Log a service" variant="text" onPress={onAddPress} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Log a service"
              onPress={onAddPress}
              style={styles.addButton}
              hitSlop={8}
            >
              <Ionicons name="add" size={20} color={color.white} />
            </Pressable>
          </View>
        ) : null}
      </View>

      {(hasStamped.current || filtering) && (rows.length > 0 || filtering) ? (
        <TimelineFilters value={input} onChange={setInput} />
      ) : null}

      {records.isLoading ? (
        <View style={styles.skeletons}>
          <Skeleton width="70%" height={16} />
          <Skeleton width="50%" height={12} />
          <Skeleton width="60%" height={16} />
        </View>
      ) : records.isError ? (
        <ErrorState message="We couldn't load this history." onRetry={() => void records.refetch()} />
      ) : rows.length === 0 ? (
        filtering ? (
          <View style={styles.empty}>
            <AppText token="body" tone="secondary" style={styles.emptyText}>
              No services match these filters.
            </AppText>
            <Button label="Clear filters" variant="secondary" onPress={() => { setInput({}) }} />
          </View>
        ) : (
          <View style={styles.empty}>
            <AppText token="body" tone="secondary" style={styles.emptyText}>
              No services logged yet. The first entry starts the record.
            </AppText>
            <Button label="Log a service" onPress={onAddPress} />
          </View>
        )
      ) : (
        <View style={styles.entries}>
          {rows.map((record, index) => (
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: color.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entries: { gap: space.sm },
  skeletons: { gap: space.sm, paddingVertical: space.sm },
  empty: { gap: space.md, alignItems: 'center', paddingVertical: space.lg },
  emptyText: { textAlign: 'center' },
})
