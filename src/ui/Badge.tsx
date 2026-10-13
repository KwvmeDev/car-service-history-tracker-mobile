import { StyleSheet, View } from 'react-native'
import { radius, space, type ColorPalette } from '@revv/tokens'

import { AppText } from './Text'
import { useThemedStyles } from './theme'

/**
 * The ONLY component allowed to use amber (design-system.md §Color law 2 —
 * amber means "this needs your attention" and nothing else).
 *
 * - `neutral`  hairline outline, no fill  — an ordinary status
 * - `due`      amberWash fill              — a reminder coming up
 * - `overdue`  solid amber, white text     — past due / an open recall
 */
export type BadgeStatus = 'neutral' | 'due' | 'overdue'

export interface BadgeProps {
  label: string
  status?: BadgeStatus
}

function buildStyles(color: ColorPalette) {
  return {
    base: {
      alignSelf: 'flex-start' as const,
      borderRadius: radius.full,
      paddingHorizontal: space.sm,
      paddingVertical: space.xxs,
    },
    neutral: { borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairline },
    due: { backgroundColor: color.amberWash },
    overdue: { backgroundColor: color.amber },
  }
}

export function Badge({ label, status = 'neutral' }: BadgeProps) {
  const { styles } = useThemedStyles(buildStyles)
  return (
    <View style={[styles.base, styles[status]]}>
      <AppText
        token="caption"
        weight="medium"
        tone={status === 'overdue' ? 'onBlue' : status === 'due' ? 'attention' : 'secondary'}
      >
        {label}
      </AppText>
    </View>
  )
}
