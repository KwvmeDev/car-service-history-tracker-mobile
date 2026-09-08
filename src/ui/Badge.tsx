import { StyleSheet, View } from 'react-native'
import { color, radius, space } from '@revv/tokens'

import { AppText } from './Text'

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

export function Badge({ label, status = 'neutral' }: BadgeProps) {
  return (
    <View style={[styles.base, STATUS_STYLE[status]]}>
      <AppText
        token="caption"
        weight="medium"
        tone={status === 'overdue' ? 'onNavy' : status === 'due' ? 'attention' : 'secondary'}
      >
        {label}
      </AppText>
    </View>
  )
}

const STATUS_STYLE = StyleSheet.create({
  neutral: { borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairline },
  due: { backgroundColor: color.amberWash },
  overdue: { backgroundColor: color.amber },
})

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: space.sm,
    paddingVertical: space.xxs,
  },
})
