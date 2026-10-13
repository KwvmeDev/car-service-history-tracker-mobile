import { Pressable, StyleSheet, View } from 'react-native'
import { radius, space, type ColorPalette } from '@revv/tokens'

import { AppText, useThemedStyles } from '@/ui'

const OPTIONS = [
  { value: 'mi', label: 'Miles' },
  { value: 'km', label: 'Kilometers' },
] as const

function buildStyles(color: ColorPalette) {
  return {
    wrap: { gap: space.xxs, alignSelf: 'stretch' as const },
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

export function MileageUnitToggle({
  value,
  onChange,
}: {
  value: 'mi' | 'km'
  onChange: (unit: 'mi' | 'km') => void
}) {
  const { styles } = useThemedStyles(buildStyles)
  return (
    <View style={styles.wrap}>
      <AppText token="label" tone="secondary">
        Mileage unit
      </AppText>
      <View style={styles.segment}>
        {OPTIONS.map((option) => {
          const active = option.value === value
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
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
    </View>
  )
}
