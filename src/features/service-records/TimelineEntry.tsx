import { useEffect, useRef } from 'react'
import { Animated, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { radius, space, stagger, type ColorPalette } from '@revv/tokens'

import { AppText, Badge, Card, useThemedStyles } from '@/ui'
import { easeEnter } from '@/ui/motion'
import { isPending, type WithPending } from '@/data/pending'

import { serviceTypeIcon } from './service-type-icons'
import { formatCost, formatDate, serviceTypeLabel } from './format'
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

const ICON_SIZE = 22
const AVATAR_SIZE = 44

/**
 * One service record — an outlined card (not the old dot-and-rail timeline): a
 * service-type icon avatar, title/shop/date+cost, a chevron. Stamps in once,
 * staggered, from a hair below with a slight scale-from-98%.
 */
function buildStyles(color: ColorPalette) {
  return {
    card: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: space.sm },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: radius.full,
      backgroundColor: color.blueWash,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    body: { flex: 1, gap: space.xxs },
    metaRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: space.xs },
  }
}

export function TimelineEntry({ record, types, index, animateIn, onPress }: TimelineEntryProps) {
  const { color, styles } = useThemedStyles(buildStyles)
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
  const dateAndCost = cost != null ? `${formatDate(record.performedOn)} · ${cost}` : formatDate(record.performedOn)

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) },
          { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
        ],
      }}
    >
      <Card surface="outline" onPress={onPress} style={styles.card}>
        <View style={styles.avatar}>
          <Ionicons name={serviceTypeIcon(record.serviceTypeKey)} size={ICON_SIZE} color={color.blue} />
        </View>

        <View style={styles.body}>
          <AppText token="heading" numberOfLines={1}>
            {serviceTypeLabel(record.serviceTypeKey, types)}
          </AppText>
          {record.shopName != null && record.shopName.trim().length > 0 ? (
            <AppText token="label" tone="secondary" numberOfLines={1}>
              {record.shopName}
            </AppText>
          ) : null}
          <View style={styles.metaRow}>
            <AppText token="label" tone="secondary">
              {dateAndCost}
            </AppText>
            {pending ? <Badge label="Not synced" status="due" /> : null}
            {attachmentCount > 0 ? (
              <AppText token="caption" tone="secondary">
                {attachmentCount} 📎
              </AppText>
            ) : null}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={color.hairline} />
      </Card>
    </Animated.View>
  )
}
