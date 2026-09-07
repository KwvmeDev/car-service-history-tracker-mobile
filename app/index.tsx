import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { color, radius, space, text } from '@revv/tokens'

import { textStyle } from '@/ui/typography'

import { useHealth } from '@/features/health/use-health'

// Sprint 0: one screen, the API health response through the generated client, all four
// states rendered deliberately. Sentence case, no exclamation marks. Data values in the
// mono/data font.
export default function HealthScreen() {
  const health = useHealth()

  if (health.phase === 'loading') {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator color={color.navy} />
        <Text style={styles.label}>Checking the api</Text>
      </View>
    )
  }

  if (health.phase === 'error') {
    return (
      <View style={styles.screen}>
        <View style={styles.card}>
          <Text style={styles.notice}>{health.message}</Text>
          <Pressable onPress={health.retry} accessibilityRole="button">
            <Text style={styles.retry}>retry</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Row label="Status" value={health.status} />
        <Row label="Version" value={health.version} />
        <Row label="Server time" value={health.time} />
        {health.phase === 'degraded' ? (
          <Text style={styles.notice}>The api is reachable but not reporting ok.</Text>
        ) : null}
      </View>
    </View>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.white, padding: space[5] },
  center: { alignItems: 'center', justifyContent: 'center', gap: space[3] },
  card: {
    backgroundColor: color.navy,
    borderRadius: radius.md,
    padding: space[5],
    gap: space[2],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: space[2],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.hairline,
  },
  label: { color: color.navySubtle, ...textStyle('label') },
  value: { color: color.white, ...textStyle('mono') },
  notice: {
    marginTop: space[3],
    padding: space[3],
    borderRadius: radius.sm,
    backgroundColor: color.amberWash,
    color: color.amber,
    fontSize: text.label.fontSize,
  },
  retry: { color: color.white, fontSize: text.body.fontSize, textDecorationLine: 'underline' },
})
