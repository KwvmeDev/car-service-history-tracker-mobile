import { StyleSheet, TextInput, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { borderWidth, color, radius, space } from '@revv/tokens'

import { AppText, Button } from '@/ui'
import { resolveFontFamily } from '@/ui/typography'

import { useServiceTypes } from './use-service-types'
import { hasActiveFilter, type TimelineFilter } from './types'

/** Date-range presets. `days: null` = all time. */
const RANGES: { key: string; label: string; days: number | null }[] = [
  { key: 'all', label: 'All time', days: null },
  { key: 'y1', label: 'Past year', days: 365 },
  { key: 'd90', label: 'Past 90 days', days: 90 },
  { key: 'd30', label: 'Past 30 days', days: 30 },
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
      tone={active ? 'onNavy' : 'secondary'}
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
 * Search + filter controls for the timeline (Sprint 8). A debounced text query
 * (debounce lives in the parent), a horizontal row of service-type chips, and a
 * date-range preset. Sentence case, tokens only.
 */
export function TimelineFilters({ value, onChange }: TimelineFiltersProps) {
  const types = useServiceTypes()
  const currentRange = activeRangeKey(value.from)

  return (
    <View style={styles.wrap}>
      <TextInput
        value={value.q ?? ''}
        onChangeText={(q) => {
          onChange({ ...value, q })
        }}
        placeholder="Search notes and shops"
        placeholderTextColor={color.hairline}
        accessibilityLabel="Search service history"
        style={[styles.search, { fontFamily: resolveFontFamily('ui', 400) }]}
        autoCorrect={false}
        returnKeyType="search"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        <Chip
          label="All types"
          active={!value.serviceTypeKey}
          onPress={() => {
            onChange({ ...value, serviceTypeKey: undefined })
          }}
        />
        {(types.data ?? []).map((t) => (
          <Chip
            key={t.key}
            label={t.label}
            active={value.serviceTypeKey === t.key}
            onPress={() => {
              onChange({ ...value, serviceTypeKey: value.serviceTypeKey === t.key ? undefined : t.key })
            }}
          />
        ))}
      </ScrollView>

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
  search: {
    borderWidth: borderWidth.thin,
    borderColor: color.hairline,
    borderRadius: radius.xs,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    color: color.ink,
  },
  chipRow: { gap: space.xxs, paddingRight: space.md },
  chip: {
    paddingVertical: space.xs,
    paddingHorizontal: space.sm,
    borderRadius: radius.full,
    borderWidth: borderWidth.thin,
    borderColor: color.hairline,
    overflow: 'hidden',
  },
  chipActive: { backgroundColor: color.navy, borderColor: color.navy },
})
