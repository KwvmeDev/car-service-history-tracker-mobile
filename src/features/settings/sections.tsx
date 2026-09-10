import type { ReactNode } from 'react'
import { StyleSheet, Switch, View } from 'react-native'
import { borderWidth, color, radius, space } from '@revv/tokens'

import { AppText } from '@/ui'

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText token="label" tone="secondary">
        {title}
      </AppText>
      <View style={styles.card}>{children}</View>
    </View>
  )
}

export function SettingsRow({
  label,
  hint,
  right,
  onPress,
}: {
  label: string
  hint?: string
  right?: ReactNode
  onPress?: () => void
}) {
  return (
    <View
      style={styles.row}
      accessibilityRole={onPress ? 'button' : undefined}
      onTouchEnd={onPress}
    >
      <View style={styles.rowText}>
        <AppText token="body">{label}</AppText>
        {hint != null ? (
          <AppText token="caption" tone="secondary">
            {hint}
          </AppText>
        ) : null}
      </View>
      {right}
    </View>
  )
}

export function SettingsToggle({
  label,
  hint,
  value,
  onValueChange,
  disabled,
}: {
  label: string
  hint?: string
  value: boolean
  onValueChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <SettingsRow
      label={label}
      hint={hint}
      right={
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ true: color.blue, false: color.blueSubtle }}
          accessibilityLabel={label}
        />
      }
    />
  )
}

const styles = StyleSheet.create({
  section: { gap: space.xs },
  card: {
    borderWidth: borderWidth.thin,
    borderColor: color.hairline,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderTopWidth: borderWidth.thin,
    borderTopColor: color.hairline,
    minHeight: 52,
  },
  rowText: { flex: 1, gap: space.xxs },
})
