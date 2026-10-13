import { StyleSheet, useColorScheme } from 'react-native'
import { color, colorDark, type ColorPalette } from '@revv/tokens'

/**
 * The active palette, resolved from the OS setting (no manual in-app toggle —
 * design-system.md §Color law 4). `color` static imports elsewhere in the app are
 * the light palette baked in at module-load time and can't react to this; any
 * component whose styling depends on colour should go through this instead.
 */
export function useColors(): ColorPalette {
  const scheme = useColorScheme()
  return scheme === 'dark' ? colorDark : color
}

/**
 * `StyleSheet.create`, but built from the active palette. Not memoised — a theme
 * change is the only thing that would invalidate it, and that's already rare
 * enough (and StyleSheet.create cheap enough) that recomputing on every render is
 * simpler than chasing a `useMemo` dependency on an inline factory function. Also
 * hands back the palette itself for inline (non-stylesheet) colour use — an
 * icon's `color` prop, an `ActivityIndicator`, `tintColor`, etc.
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<unknown>>(
  factory: (color: ColorPalette) => T,
): { color: ColorPalette; styles: T } {
  const activeColor = useColors()
  return { color: activeColor, styles: StyleSheet.create(factory(activeColor)) }
}
