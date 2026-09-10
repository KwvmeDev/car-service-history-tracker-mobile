import { type ReactNode } from 'react'
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native'
import { borderWidth, color, radius, shadow, space } from '@revv/tokens'

export interface CardProps {
  children: ReactNode
  /** blue (vehicle cards, default) or white (neutral surface with a hairline border). */
  surface?: 'blue' | 'white'
  onPress?: () => void
  style?: ViewStyle
  /** For the shared-element morph — see screen-transitions / VehicleProfile. */
  nativeID?: string
  accessibilityLabel?: string
}

/**
 * design-system.md §Core components. A blue card carries structure; a white card is a
 * neutral container with a hairline. Radius is always `radius.md`.
 */
export function Card({
  children,
  surface = 'blue',
  onPress,
  style,
  nativeID,
  accessibilityLabel,
}: CardProps) {
  const body = (
    <View
      nativeID={nativeID}
      style={[styles.base, surface === 'blue' ? styles.blue : styles.white, style]}
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
  // A blue card floats — colour-blocking is the primary depth cue, shadow is secondary
  // (open-design.ai-DESIGN.md §6).
  blue: { backgroundColor: color.blue, ...shadow.lg.native },
  white: {
    backgroundColor: color.white,
    borderWidth: borderWidth.thin,
    borderColor: color.hairline,
    ...shadow.sm.native,
  },
  pressed: { opacity: 0.92 },
})
