import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { space, stagger } from '@revv/tokens'

import { AppText } from '@/ui'
import { easeEnter } from '@/ui/motion'

/**
 * design-system.md §Delight — "the decoded year/make/model fills in field by field as
 * if being read off the plate". Each row fades + slides up in sequence.
 */
export function VinReveal({ fields }: { fields: { label: string; value: string }[] }) {
  return (
    <View style={styles.wrap}>
      {fields.map((field, i) => (
        <RevealRow key={field.label} delay={i * stagger.item * 3} {...field} />
      ))}
    </View>
  )
}

function RevealRow({ label, value, delay }: { label: string; value: string; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 300,
      delay,
      easing: easeEnter,
      useNativeDriver: true,
    }).start()
  }, [anim, delay])

  return (
    <Animated.View
      style={[
        styles.row,
        { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] },
      ]}
    >
      <AppText token="label" tone="secondary">
        {label}
      </AppText>
      <AppText token="mono">{value}</AppText>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
})
