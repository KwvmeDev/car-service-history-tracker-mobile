import { useRef } from 'react'
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
} from 'react-native'
import { borderWidth, color, radius, shadow, space } from '@revv/tokens'

import { AppText } from './Text'
import { microTiming } from './motion'

type Variant = 'primary' | 'secondary' | 'text'

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string
  variant?: Variant
  loading?: boolean
  /** Fill the available width. Primary CTAs usually do. */
  block?: boolean
}

/**
 * open-design.ai-DESIGN.md §4: every button is a pill (`radius.full`). Primary is a
 * blue fill with a soft shadow and a lift on press; secondary is a light fill with a
 * hairline border; text is bare. One primary per screen (design-system.md §Simplicity).
 */
export function Button({
  label,
  variant = 'primary',
  loading = false,
  block = false,
  disabled,
  ...rest
}: ButtonProps) {
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
          VARIANT_STYLE[variant],
          block ? styles.block : undefined,
          isDisabled ? styles.disabled : undefined,
        ]}
        {...rest}
      >
        <View style={styles.inner}>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={variant === 'primary' ? color.white : color.blue}
            />
          ) : (
            <AppText
              token="body"
              weight={variant === 'primary' ? 'bold' : 'semibold'}
              tone={variant === 'primary' ? 'onBlue' : 'primary'}
            >
              {label}
            </AppText>
          )}
        </View>
      </Pressable>
    </Animated.View>
  )
}

const VARIANT_STYLE = StyleSheet.create({
  primary: { backgroundColor: color.blue, minHeight: 52 },
  secondary: {
    borderWidth: borderWidth.thin,
    borderColor: color.hairline,
    backgroundColor: color.white,
    minHeight: 48,
  },
  text: { backgroundColor: 'transparent', minHeight: 44 },
})

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    paddingVertical: space.sm,
    paddingHorizontal: space.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs },
  block: { alignSelf: 'stretch' },
  disabled: { opacity: 0.45 },
})
