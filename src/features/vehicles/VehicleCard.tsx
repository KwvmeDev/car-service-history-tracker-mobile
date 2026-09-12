import { Image, StyleSheet, View } from 'react-native'
import { color, radius, space } from '@revv/tokens'

import { AppText, Badge, Card, StatRow } from '@/ui'
import { isPending, type WithPending } from '@/data/pending'
import { useReminders, worstStatus } from '@/features/reminders/hooks'

import { vehicleTitle } from './types'
import type { VehicleListItem } from './types'

function ownedSinceLabel(iso: string | null): string {
  if (iso == null) return '—'
  return String(new Date(iso).getFullYear())
}

export function VehicleCard({
  vehicle,
  onPress,
}: {
  vehicle: WithPending<VehicleListItem>
  onPress: () => void
}) {
  const pending = isPending(vehicle)
  const title = vehicleTitle(vehicle)
  const { data: reminders } = useReminders(vehicle.id)
  const attention = worstStatus(reminders)

  return (
    <Card
      surface="blue"
      onPress={onPress}
      accessibilityLabel={`Open ${title}`}
      nativeID={`vehicle-card-${vehicle.id}`}
    >
      <View style={styles.topRow}>
        {vehicle.photoUrl != null ? (
          <Image source={{ uri: vehicle.photoUrl }} style={styles.photo} />
        ) : null}
        <View style={styles.identity}>
          <AppText token="title" tone="onBlue" numberOfLines={1}>
            {title}
          </AppText>
          {vehicle.vin != null ? (
            <AppText token="mono" tone="onBlueSubtle" numberOfLines={1}>
              {vehicle.vin}
            </AppText>
          ) : (
            <AppText token="caption" tone="onBlueSubtle">
              No VIN yet
            </AppText>
          )}
        </View>
        {pending ? (
          <Badge label="Not synced" status="due" />
        ) : attention !== 'ok' ? (
          <Badge
            label={attention === 'overdue' ? 'Service overdue' : 'Service due'}
            status={attention === 'overdue' ? 'overdue' : 'due'}
          />
        ) : null}
      </View>

      <View style={styles.divider} />

      <StatRow
        stats={[
          {
            label: `Mileage${vehicle.mileageUnit === 'km' ? ' (km)' : ''}`,
            value:
              vehicle.currentMileage != null
                ? vehicle.currentMileage.toLocaleString('en-US')
                : '—',
          },
          { label: 'Records', value: '0' },
          { label: 'Owned since', value: ownedSinceLabel(vehicle.ownedSince) },
        ]}
      />
    </Card>
  )
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.xs },
  photo: { width: 44, height: 44, borderRadius: radius.sm },
  identity: { flex: 1, gap: space.xxs },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: color.hairline },
})
