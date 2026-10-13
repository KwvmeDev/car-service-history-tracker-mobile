import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native'
import { radius, space, type ColorPalette } from '@revv/tokens'

import { useThemedStyles } from './theme'

export interface SkeletonProps {
  width?: ViewStyle['width']
  height?: number
  style?: ViewStyle
}

function buildStyles(color: ColorPalette) {
  return {
    block: { backgroundColor: color.hairline, borderRadius: radius.sm },
    card: {
      backgroundColor: color.canvas,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: color.hairline,
      borderRadius: radius.md,
      padding: space.md,
      gap: space.sm,
    },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: color.hairline },
  }
}

/**
 * A single shimmering block. Skeletons must match the real layout they stand in for
 * (design-system.md, anti-patterns) — compose these to mirror the actual card/list,
 * never a generic spinner.
 */
export function Skeleton({ width = '100%', height = 16, style }: SkeletonProps) {
  const { styles } = useThemedStyles(buildStyles)
  const pulse = useRef(new Animated.Value(0.5)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => {
      loop.stop()
    }
  }, [pulse])

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.block, { width, height, opacity: pulse }, style]}
    />
  )
}

/** The garage's loading state — three vehicle-card-shaped blocks. */
export function VehicleCardSkeleton() {
  const { styles } = useThemedStyles(buildStyles)
  return (
    <View style={styles.card}>
      <Skeleton width="60%" height={20} />
      <Skeleton width="40%" height={14} />
      <View style={styles.divider} />
      <Skeleton width="100%" height={32} />
    </View>
  )
}
