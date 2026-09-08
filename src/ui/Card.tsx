import { type ReactNode } from 'react'
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native'
import { borderWidth, color, radius, shadow, space } from '@revv/tokens'

export interface CardProps {
  children: ReactNode
  /** navy (vehicle cards, default) or white (neutral surface with a hairline border). */
  surface?: 'navy' | 'white'
  onPress?: () => void
  style?: ViewStyle
  /** For the shared-element morph — see screen-transitions / VehicleProfile. */
  nativeID?: string
  accessibilityLabel?: string
}

/**
 * design-system.md §Core components. A navy card carries structure; a white card is a
 * neutral container with a hairline. Radius is always `radius.md`.
 */
export function Card({
  children,
  surface = 'navy',
  onPress,
  style,
  nativeID,
  accessibilityLabel,
}: CardProps) {
  const body = (
    <View
      nativeID={nativeID}
      style={[styles.base, surface === 'navy' ? styles.navy : styles.white, style]}
    >
      {children}
    </View>
  )

  if (!onPress) return body

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => (pressed ? styles.pressed : undefined)}
    >
      {body}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.md, padding: space.lg, gap: space.sm },
  // A navy card floats — colour-blocking is the primary depth cue, shadow is secondary
  // (open-design.ai-DESIGN.md §6).
  navy: { backgroundColor: color.navy, ...shadow.lg.native },
  white: {
    backgroundColor: color.white,
    borderWidth: borderWidth.thin,
    borderColor: color.hairline,
    ...shadow.sm.native,
  },
  pressed: { opacity: 0.92 },
})
