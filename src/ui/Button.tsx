import { useRef, type ReactNode } from 'react'
import { ActivityIndicator, Animated, Pressable, View, type PressableProps } from 'react-native'
import { borderWidth, radius, shadow, space, type ColorPalette } from '@revv/tokens'

import { AppText } from './Text'
import { microTiming } from './motion'
import { useThemedStyles } from './theme'

type Variant = 'primary' | 'secondary' | 'text'
type Size = 'md' | 'sm'

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string
  variant?: Variant
  /** md (default) is the standard CTA height; sm is for a secondary action
   *  inside a card or row that shouldn't compete with the screen's primary CTA. */
  size?: Size
  loading?: boolean
  /** Fill the available width. Primary CTAs usually do. */
  block?: boolean
  /** A provider mark or similar, shown before the label. Hidden while loading. */
  icon?: ReactNode
}

function buildStyles(color: ColorPalette) {
  return {
    base: {
      borderRadius: radius.full,
      paddingVertical: space.sm,
      paddingHorizontal: space.xl,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    inner: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: space.xs,
    },
    sm: { minHeight: 36, paddingVertical: space.xs, paddingHorizontal: space.lg },
    block: { alignSelf: 'stretch' as const },
    disabled: { opacity: 0.45 },
    primary: { backgroundColor: color.blue, minHeight: 52 },
    secondary: {
      borderWidth: borderWidth.thin,
      borderColor: color.hairline,
      backgroundColor: color.canvas,
      minHeight: 48,
    },
    text: { backgroundColor: 'transparent', minHeight: 44 },
  }
}

/**
 * open-design.ai-DESIGN.md §4: every button is a pill (`radius.full`). Primary is a
 * blue fill with a soft shadow and a lift on press; secondary is a light fill with a
 * hairline border; text is bare. One primary per screen (design-system.md §Simplicity).
 */
export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  block = false,
  icon,
  disabled,
  ...rest
}: ButtonProps) {
  const { color, styles } = useThemedStyles(buildStyles)
  const lift = useRef(new Animated.Value(0)).current
  const isDisabled = disabled === true || loading

  const press = (to: number) => {
    Animated.timing(lift, { toValue: to, ...microTiming }).start()
  }
  const translateY = lift.interpolate({ inputRange: [0, 1], outputRange: [0, -1] })

  return (
    <Animated.View
      style={[
        block ? styles.block : undefined,
        variant === 'primary' && !isDisabled ? shadow.md.native : undefined,
        { transform: [{ translateY }] },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        onPressIn={() => {
          press(1)
        }}
        onPressOut={() => {
          press(0)
        }}
        style={[
          styles.base,
          styles[variant],
          size === 'sm' ? styles.sm : undefined,
          block ? styles.block : undefined,
          isDisabled ? styles.disabled : undefined,
        ]}
        {...rest}
      >
        <View style={styles.inner}>
          {loading ? (
            <ActivityIndicator size="small" color={variant === 'primary' ? color.white : color.blue} />
          ) : (
            <>
              {icon}
              <AppText
                token={size === 'sm' ? 'label' : 'body'}
                weight={variant === 'primary' ? 'bold' : 'semibold'}
                tone={variant === 'primary' ? 'onBlue' : 'primary'}
              >
                {label}
              </AppText>
            </>
          )}
        </View>
      </Pressable>
    </Animated.View>
  )
}
