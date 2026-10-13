import { TextInput, View, type ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { borderWidth, radius, space, type ColorPalette } from '@revv/tokens'

import { useThemedStyles } from './theme'

export interface SearchBarProps {
  value: string
  onChangeText: (text: string) => void
  placeholder: string
  style?: ViewStyle
}

function buildStyles(color: ColorPalette) {
  return {
    bar: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: color.canvas,
      borderRadius: radius.full,
      borderWidth: borderWidth.thin,
      borderColor: color.hairline,
      paddingHorizontal: space.md,
      height: 48,
      gap: space.xs,
    },
    input: { flex: 1, fontSize: 16, color: color.ink },
  }
}

/**
 * A pill search field — canvas fill with a hairline border, so it reads clearly on
 * both a blue hero (Home) and the plain canvas (Vehicles) without a per-screen
 * variant.
 */
export function SearchBar({ value, onChangeText, placeholder, style }: SearchBarProps) {
  const { color, styles } = useThemedStyles(buildStyles)
  return (
    <View style={[styles.bar, style]}>
      <Ionicons name="search" size={18} color={color.placeholder} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={color.placeholder}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
    </View>
  )
}
