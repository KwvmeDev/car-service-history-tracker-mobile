import { Pressable, StyleSheet, View } from 'react-native'
import { borderWidth, color, radius, space } from '@revv/tokens'

import { AppText } from '@/ui'

import type { GarageSort } from './api'

const OPTIONS: { key: GarageSort; label: string }[] = [
  { key: 'recent', label: 'Recent' },
  { key: 'nickname', label: 'Name' },
  { key: 'mileage', label: 'Mileage' },
]

export interface GarageSortControlProps {
  value: GarageSort
  onChange: (sort: GarageSort) => void
}

/**
 * A small segmented control for the garage order (Sprint 8). Sentence case, no
 * ALL CAPS (design-system.md); the active segment is a blue fill.
 */
export function GarageSortControl({ value, onChange }: GarageSortControlProps) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {OPTIONS.map((option) => {
        const active = option.key === value
        return (
          <Pressable
            key={option.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Sort by ${option.label.toLowerCase()}`}
            onPress={() => {
              onChange(option.key)
            }}
            style={[styles.segment, active && styles.segmentActive]}
            hitSlop={6}
          >
            <AppText token="label" tone={active ? 'onBlue' : 'secondary'}>
              {option.label}
            </AppText>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.xxs,
    alignSelf: 'flex-start',
    padding: space.xxs,
    borderRadius: radius.full,
    borderWidth: borderWidth.thin,
    borderColor: color.hairline,
  },
  segment: {
    paddingVertical: space.xs,
    paddingHorizontal: space.sm,
    borderRadius: radius.full,
  },
  segmentActive: { backgroundColor: color.blue },
})
