import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { radius, space, text, type ColorPalette } from '@revv/tokens'

import { textStyle } from '@/ui/typography'
import { useThemedStyles } from '@/ui/theme'

import { useHealth } from '@/features/health/use-health'

function buildStyles(color: ColorPalette) {
  return {
    screen: { flex: 1, backgroundColor: color.canvas, padding: space.xl },
    center: { alignItems: 'center' as const, justifyContent: 'center' as const, gap: space.sm },
    card: {
      backgroundColor: color.blue,
      borderRadius: radius.md,
      padding: space.xl,
      gap: space.xs,
    },
    row: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      paddingVertical: space.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: color.hairline,
    },
    label: { color: color.blueSubtle, ...textStyle('label') },
    value: { color: color.white, ...textStyle('mono') },
    notice: {
      marginTop: space.sm,
      padding: space.sm,
      borderRadius: radius.sm,
      backgroundColor: color.amberWash,
      color: color.amber,
      fontSize: text.label.fontSize,
    },
    retry: { color: color.white, fontSize: text.body.fontSize, textDecorationLine: 'underline' as const },
  }
}

// Sprint 0: one screen, the API health response through the generated client, all four
// states rendered deliberately. Sentence case, no exclamation marks. Data values in the
// mono/data font.
export default function HealthScreen() {
  const { color, styles } = useThemedStyles(buildStyles)
  const health = useHealth()

  if (health.phase === 'loading') {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator color={color.blue} />
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
  const { styles } = useThemedStyles(buildStyles)
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  )
}
