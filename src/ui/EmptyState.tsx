import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { color, space } from '@revv/tokens'

import { AppText } from './Text'
import { Button } from './Button'
import { easeEnter } from './motion'

export interface EmptyStateProps {
  /** Big glyph — a plate, a key, a stamp. One emoji keeps it dependency-free for v1. */
  glyph: string
  title: string
  body: string
  /** The nudge toward the one primary action. */
  actionLabel: string
  onAction: () => void
}

/**
 * design-system.md — empty states are designed, never "No items yet". A floating
 * glyph, warm copy, and an animated arrow nudging toward the primary action.
 */
export function EmptyState({ glyph, title, body, actionLabel, onAction }: EmptyStateProps) {
  const float = useRef(new Animated.Value(0)).current
  const nudge = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2000, easing: easeEnter, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2000, easing: easeEnter, useNativeDriver: true }),
      ]),
    )
    const b = Animated.loop(
      Animated.sequence([
        Animated.timing(nudge, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(nudge, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    )
    a.start()
    b.start()
    return () => {
      a.stop()
      b.stop()
    }
  }, [float, nudge])

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] })
  const nudgeY = nudge.interpolate({ inputRange: [0, 1], outputRange: [0, 6] })

  return (
    <View style={styles.wrap}>
      <Animated.Text style={[styles.glyph, { transform: [{ translateY }] }]}>{glyph}</Animated.Text>
      <AppText token="title">
        {title}
      </AppText>
      <AppText token="body" tone="secondary" style={styles.body}>
        {body}
      </AppText>
      <Animated.View style={{ transform: [{ translateY: nudgeY }] }}>
        <AppText token="caption" tone="secondary">
          ↓
        </AppText>
      </Animated.View>
      <Button label={actionLabel} onPress={onAction} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm, padding: space.xl },
  glyph: { fontSize: 44, color: color.blue },
  body: { textAlign: 'center', maxWidth: 280 },
})
