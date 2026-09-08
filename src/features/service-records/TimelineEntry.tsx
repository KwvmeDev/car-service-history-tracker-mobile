import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { color, space, stagger } from '@revv/tokens'

import { AppText, Badge } from '@/ui'
import { easeEnter } from '@/ui/motion'
import { isPending, type WithPending } from '@/data/pending'

import { entrySubtitle, formatCost, formatMileage, serviceTypeLabel } from './format'
import type { ServiceRecord, ServiceType } from './types'

export interface TimelineEntryProps {
  record: WithPending<ServiceRecord>
  types: ServiceType[] | undefined
  /** Position in the list — drives the stamp-in stagger. */
  index: number
  /** Stamp in on mount (first render of the list). After that, entries just appear. */
  animateIn: boolean
  onPress: () => void
}

/**
 * One entry on the stamped timeline (design-system.md §Core components → Timeline
 * entry). Left rail marker on a hairline rail; type + mileage (mono, right-aligned);
 * shop + date secondary; cost mono. Stamps in once, staggered, from a hair below with
 * a slight scale-from-98%.
 */
export function TimelineEntry({ record, types, index, animateIn, onPress }: TimelineEntryProps) {
  const anim = useRef(new Animated.Value(animateIn ? 0 : 1)).current

  useEffect(() => {
    if (!animateIn) return
    Animated.timing(anim, {
      toValue: 1,
      duration: 260,
      delay: index * stagger.item,
      easing: easeEnter,
      useNativeDriver: true,
    }).start()
  }, [anim, animateIn, index])

  const cost = formatCost(record.costMinor, record.costCurrency)
  const pending = isPending(record)
  const attachmentCount = record.attachments.length

  return (
    <Animated.View
      style={[
        styles.row,
        {
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) },
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
          ],
        },
      ]}
    >
      <View style={styles.rail}>
        <View style={styles.marker} />
        <View style={styles.line} />
      </View>

      <View accessibilityRole="button" onTouchEnd={onPress} style={styles.body}>
        <View style={styles.topLine}>
          <AppText token="heading" style={styles.type} numberOfLines={1}>
            {serviceTypeLabel(record.serviceTypeKey, types)}
          </AppText>
          <AppText token="mono">{formatMileage(record.mileage)}</AppText>
        </View>

        <AppText token="label" tone="secondary">
          {entrySubtitle(record)}
        </AppText>

        <View style={styles.bottomLine}>
          <View style={styles.tags}>
            {pending ? <Badge label="Not synced" status="due" /> : null}
            {attachmentCount > 0 ? (
              <AppText token="caption" tone="secondary">
                {attachmentCount} 📎
              </AppText>
            ) : null}
          </View>
          {cost != null ? <AppText token="mono">{cost}</AppText> : null}
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  rail: { alignItems: 'center', width: 12 },
  marker: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: color.navy,
    marginTop: space.xxs,
  },
  line: { flex: 1, width: 1, backgroundColor: color.hairline, marginTop: space.xxs },
  body: { flex: 1, paddingBottom: space.lg, gap: space.xxs },
  topLine: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.sm },
  type: { flex: 1 },
  bottomLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.xxs },
  tags: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
})
