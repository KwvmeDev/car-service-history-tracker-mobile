import { StyleSheet, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { borderWidth, color, radius, space } from '@revv/tokens'

import { AppText, Button, SearchBar } from '@/ui'

import { hasActiveFilter, type TimelineFilter } from './types'

/** Date-range presets. `days: null` = all time. */
const RANGES: { key: string; label: string; days: number | null }[] = [
  { key: 'all', label: 'All time', days: null },
  { key: 'y1', label: 'Past year', days: 365 },
  { key: 'd90', label: '90 days', days: 90 },
  { key: 'd30', label: '30 days', days: 30 },
  { key: 'd14', label: '14 days', days: 14 },
]

function rangeFrom(days: number | null): string | undefined {
  if (days == null) return undefined
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function activeRangeKey(from: string | undefined): string {
  if (!from) return 'all'
  const match = RANGES.find((r) => rangeFrom(r.days) === from)
  return match?.key ?? 'all'
}

export interface TimelineFiltersProps {
  value: TimelineFilter
  onChange: (next: TimelineFilter) => void
}

interface ChipProps {
  label: string
  active: boolean
  onPress: () => void
}

function Chip({ label, active, onPress }: ChipProps) {
  return (
    <AppText
      token="label"
      tone={active ? 'onBlue' : 'primary'}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      {label}
    </AppText>
  )
}

/**
 * Search + date-range filters for the timeline. A debounced text query (debounce
 * lives in the parent) and a horizontal row of date-range presets — the
 * service-type chip row was dropped from this redesign (search covers it).
 */
export function TimelineFilters({ value, onChange }: TimelineFiltersProps) {
  const currentRange = activeRangeKey(value.from)

  return (
    <View style={styles.wrap}>
      <SearchBar
        value={value.q ?? ''}
        onChangeText={(q) => {
          onChange({ ...value, q })
        }}
        placeholder="Search notes and shops"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {RANGES.map((r) => (
          <Chip
            key={r.key}
            label={r.label}
            active={currentRange === r.key}
            onPress={() => {
              onChange({ ...value, from: rangeFrom(r.days) })
            }}
          />
        ))}
      </ScrollView>

      {hasActiveFilter(value) ? (
        <Button
          label="Clear filters"
          variant="text"
          onPress={() => {
            onChange({})
          }}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  chipRow: { gap: space.xs, paddingRight: space.md },
  chip: {
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
    borderRadius: radius.full,
    borderWidth: borderWidth.thin,
    borderColor: color.blue,
    overflow: 'hidden',
  },
  chipActive: { backgroundColor: color.blue },
})
