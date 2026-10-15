import { Pressable, StyleSheet, View } from 'react-native'
import { radius, space, type ColorPalette } from '@revv/tokens'

import { AppText } from './Text'
import { useThemedStyles } from './theme'

export interface SegmentedControlProps<T extends string> {
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  accessibilityLabel: string
}

function buildStyles(color: ColorPalette) {
  return {
    segment: {
      flexDirection: 'row' as const,
      backgroundColor: color.canvas,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: color.hairline,
      borderRadius: radius.full,
      padding: 2,
    },
    option: {
      flex: 1,
      alignItems: 'center' as const,
      paddingVertical: space.xs,
      borderRadius: radius.full,
    },
    optionActive: { backgroundColor: color.blue },
  }
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const { styles } = useThemedStyles(buildStyles)
  return (
    <View style={styles.segment} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            onPress={() => {
              onChange(option.value)
            }}
            style={[styles.option, active ? styles.optionActive : undefined]}
          >
            <AppText token="label" weight={active ? 'semibold' : 'regular'} tone={active ? 'onBlue' : 'secondary'}>
              {option.label}
            </AppText>
          </Pressable>
        )
      })}
    </View>
  )
}
