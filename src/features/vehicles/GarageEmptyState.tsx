import { useEffect, useRef } from 'react'
import { Animated, View, useColorScheme, type ImageSourcePropType } from 'react-native'
import { radius, space, type ColorPalette } from '@revv/tokens'

import { AppText, Button, useThemedStyles } from '@/ui'
import { easeEnter, useReducedMotion } from '@/ui/motion'

// eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro requires a static require() for images
const CAR = require('../../../assets/illustrations/garage-empty.png') as ImageSourcePropType

/**
 * The "your garage is empty" moment on Home and Vehicles — a quiet blueWash card
 * (not full-bleed, not the plain emoji-glyph EmptyState used elsewhere) carrying a
 * bespoke illustration. Distinct from the shared `EmptyState` primitive because
 * this exact card+illustration treatment only applies to the garage-empty moment.
 */
export function GarageEmptyState({ onAdd }: { onAdd: () => void }) {
  const { color, styles } = useThemedStyles(buildStyles)
  const dark = useColorScheme() === 'dark'
  const reducedMotion = useReducedMotion()
  const float = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (reducedMotion) return undefined
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2200, easing: easeEnter, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2200, easing: easeEnter, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => {
      loop.stop()
    }
  }, [reducedMotion, float])

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] })

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Animated.Image
          source={CAR}
          resizeMode="contain"
          tintColor={dark ? color.ink : undefined}
          style={[styles.illustration, { transform: [{ translateY }] }]}
        />
        <AppText token="title" style={styles.title}>
          Your garage is empty
        </AppText>
        <AppText token="body" tone="secondary" style={styles.body}>
          Add your first vehicle to start building its record.
        </AppText>
        <Button label="Add a vehicle" onPress={onAdd} />
      </View>
    </View>
  )
}

function buildStyles(color: ColorPalette) {
  return {
    wrap: { flex: 1, justifyContent: 'center' as const },
    card: {
      backgroundColor: color.blueWash,
      borderRadius: radius.lg,
      padding: space.xl,
      marginHorizontal: space.md,
      alignItems: 'center' as const,
      gap: space.sm,
    },
    illustration: { width: 160, height: 118, marginBottom: space.xs },
    title: { textAlign: 'center' as const },
    body: { textAlign: 'center' as const },
  }
}
