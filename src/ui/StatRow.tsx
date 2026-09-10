import { Fragment } from 'react'
import { StyleSheet, View } from 'react-native'
import { color, space } from '@revv/tokens'

import { AppText } from './Text'

export interface Stat {
  label: string
  /** Rendered in the mono/data font — mileage, counts, dates. */
  value: string
}

export interface StatRowProps {
  stats: Stat[]
  /** blue card context (default) or a white surface. */
  surface?: 'blue' | 'white'
}

/**
 * design-system.md §Core components — the stats row under a card's hairline divider:
 * a mono value over a caption label, evenly spread, thin vertical rules between.
 */
export function StatRow({ stats, surface = 'blue' }: StatRowProps) {
  const onBlue = surface === 'blue'
  return (
    <View style={styles.row}>
      {stats.map((stat, i) => (
        <Fragment key={stat.label}>
          {i > 0 ? <View style={styles.rule} /> : null}
          <View style={styles.cell}>
            <AppText token="mono" tone={onBlue ? 'onBlue' : 'primary'}>
              {stat.value}
            </AppText>
            <AppText token="caption" tone={onBlue ? 'onBlueSubtle' : 'secondary'}>
              {stat.label}
            </AppText>
          </View>
        </Fragment>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  cell: { flex: 1, gap: space.xxs },
  rule: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: color.hairline },
})
