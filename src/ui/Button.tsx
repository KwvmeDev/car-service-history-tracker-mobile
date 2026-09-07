import { useRef } from 'react'
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
} from 'react-native'
import { color, radius, space } from '@revv/tokens'

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
 * design-system.md §Core components: the primary CTA is always navy-filled, white
 * text, one per screen. `secondary` is a hairline outline; `text` is a bare link.
 * Never two filled buttons competing on one screen — that is a review failure, not
 * something this component can stop, so keep it in mind.
 */
export function Button({
  label,
  variant = 'primary',
  loading = false,
  block = false,
  disabled,
  ...rest
}: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current
  const isDisabled = disabled === true || loading

  const press = (to: number) => {
    Animated.timing(scale, { toValue: to, ...microTiming }).start()
  }

  return (
    <Animated.View style={[block ? styles.block : undefined, { transform: [{ scale }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        onPressIn={() => {
          press(0.97)
        }}
        onPressOut={() => {
          press(1)
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
              color={variant === 'primary' ? color.white : color.navy}
            />
          ) : (
            <AppText token="body" weight="medium" tone={variant === 'primary' ? 'onNavy' : 'primary'}>
              {label}
            </AppText>
          )}
        </View>
      </Pressable>
    </Animated.View>
  )
}

const VARIANT_STYLE = StyleSheet.create({
  primary: { backgroundColor: color.navy },
  secondary: { borderWidth: StyleSheet.hairlineWidth, borderColor: color.ink },
  text: { backgroundColor: 'transparent' },
})

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.sm,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    minHeight: 48,
    justifyContent: 'center',
  },
  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[2] },
  block: { alignSelf: 'stretch' },
  disabled: { opacity: 0.45 },
})
