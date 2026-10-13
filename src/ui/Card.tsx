import { type ReactNode } from 'react'
import { Pressable, View, type ViewStyle } from 'react-native'
import { borderWidth, radius, shadow, space, type ColorPalette } from '@revv/tokens'

import { useThemedStyles } from './theme'

export interface CardProps {
  children: ReactNode
  /** blue (vehicle cards, default), white (neutral surface with a hairline
   *  border), or outline (a calm status card — blue stroke, no fill weight,
   *  no shadow; for a quiet "everything's fine" moment like the Home dashboard's
   *  reminders summary). */
  surface?: 'blue' | 'white' | 'outline'
  onPress?: () => void
  style?: ViewStyle
  /** For the shared-element morph — see screen-transitions / VehicleProfile. */
  nativeID?: string
  accessibilityLabel?: string
}

function buildStyles(color: ColorPalette) {
  return {
    base: { borderRadius: radius.md, padding: space.lg, gap: space.sm },
    // A blue card floats — colour-blocking is the primary depth cue, shadow is secondary
    // (open-design.ai-DESIGN.md §6).
    blue: { backgroundColor: color.blue, ...shadow.lg.native },
    white: {
      backgroundColor: color.canvas,
      borderWidth: borderWidth.thin,
      borderColor: color.hairline,
      ...shadow.sm.native,
    },
    // Quiet status container — a blue stroke carries the whole surface, no fill
    // weight or shadow (this is the one card that isn't trying to float).
    outline: {
      backgroundColor: color.canvas,
      borderWidth: borderWidth.thin,
      borderColor: color.blue,
    },
    pressed: { opacity: 0.92 },
  } as const
}

/**
 * design-system.md §Core components. A blue card carries structure; a white card is a
 * neutral container with a hairline; an outline card is a quiet status container with
 * no fill or shadow weight. Radius is always `radius.md`.
 */
export function Card({
  children,
  surface = 'blue',
  onPress,
  style,
  nativeID,
  accessibilityLabel,
}: CardProps) {
  const { styles } = useThemedStyles(buildStyles)

  const body = (
    <View nativeID={nativeID} style={[styles.base, styles[surface], style]}>
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
