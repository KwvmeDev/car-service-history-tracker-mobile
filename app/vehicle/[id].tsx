import { useRef, useState } from 'react'
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Stack, useLocalSearchParams } from 'expo-router'
import { color, radius, space } from '@revv/tokens'

import { AppText, Badge, Button, CountUp, ErrorState, Skeleton, StatRow } from '@/ui'
import { enterTiming } from '@/ui/motion'
import { isPending } from '@/data/pending'
import { EditVehicleSheet } from '@/features/vehicles/EditVehicleSheet'
import { useDecodeVin, useVehicle } from '@/features/vehicles/hooks'
import { vehicleTitle } from '@/features/vehicles/types'

export default function VehicleProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: vehicle, isLoading, isError, refetch, isPlaceholderData } = useVehicle(id)
  const decode = useDecodeVin(id)
  const [editing, setEditing] = useState(false)

  // The header "prints in" once — the card→profile crossfade fallback (ADR-noted:
  // full shared-element morph deferred; this is the tween fallback).
  const printIn = useRef(new Animated.Value(0)).current
  const started = useRef(false)
  if (vehicle && !started.current) {
    started.current = true
    Animated.timing(printIn, { toValue: 1, ...enterTiming }).start()
  }

  if (isLoading && !vehicle) {
    return (
      <View style={styles.screen}>
        <View style={styles.headerSkeleton}>
          <Skeleton width="55%" height={26} />
          <Skeleton width="70%" height={16} />
          <View style={styles.divider} />
          <Skeleton width="100%" height={34} />
        </View>
      </View>
    )
  }

  if (isError || !vehicle) {
    return (
      <View style={styles.screen}>
        <ErrorState onRetry={() => void refetch()} />
      </View>
    )
  }

  const title = vehicleTitle(vehicle)
  const pending = isPending(vehicle) || isPlaceholderData

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title }} />

      <Animated.View
        nativeID={`vehicle-card-${vehicle.id}`}
        style={[
          styles.header,
          {
            opacity: printIn,
            transform: [
              { translateY: printIn.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
            ],
          },
        ]}
      >
        <View style={styles.identityRow}>
          <View style={styles.identity}>
            <AppText token="display" weight="medium" tone="onNavy">
              {title}
            </AppText>
            {vehicle.vin != null ? (
              <AppText token="mono" tone="onNavySubtle">
                {vehicle.vin}
              </AppText>
            ) : null}
          </View>
          {pending ? <Badge label="Not synced" status="due" /> : null}
        </View>

        {vehicle.year != null || vehicle.make != null ? (
          <AppText token="body" tone="onNavySubtle">
            {[vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(' ')}
          </AppText>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <CountUp value={vehicle.currentMileage ?? 0} tone="onNavy" />
            <AppText token="caption" tone="onNavySubtle">
              Mileage{vehicle.mileageUnit === 'km' ? ' (km)' : ''}
            </AppText>
          </View>
          <View style={styles.rule} />
          <View style={styles.stat}>
            <StatRow stats={[{ label: 'Records', value: '0' }]} />
          </View>
          <View style={styles.rule} />
          <View style={styles.stat}>
            <StatRow
              stats={[
                {
                  label: 'Owned since',
                  value: vehicle.ownedSince != null ? String(new Date(vehicle.ownedSince).getFullYear()) : '—',
                },
              ]}
            />
          </View>
        </View>
      </Animated.View>

      <View style={styles.actions}>
        <Button
          label="Edit vehicle"
          variant="secondary"
          onPress={() => {
            setEditing(true)
          }}
        />
        {vehicle.vin != null ? (
          <Button
            label={decode.isPending ? 'Decoding…' : 'Re-decode VIN'}
            variant="text"
            loading={decode.isPending}
            onPress={() => {
              decode.mutate()
            }}
          />
        ) : null}
      </View>

      <View style={styles.timeline}>
        <AppText token="label" tone="secondary">
          Service history
        </AppText>
        <Pressable style={styles.timelineEmpty}>
          <AppText token="body" tone="secondary" style={styles.timelineText}>
            No services logged yet. The first entry starts the record.
          </AppText>
        </Pressable>
      </View>

      <EditVehicleSheet
        vehicle={vehicle}
        visible={editing}
        onDismiss={() => {
          setEditing(false)
        }}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.white },
  content: { padding: space[4], gap: space[4] },
  header: { backgroundColor: color.navy, borderRadius: radius.md, padding: space[4], gap: space[3] },
  headerSkeleton: {
    backgroundColor: color.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.hairline,
    borderRadius: radius.md,
    padding: space[4],
    gap: space[3],
    margin: space[4],
  },
  identityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space[2] },
  identity: { flex: 1, gap: space[1] },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: color.hairline },
  statsRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stat: { flex: 1, gap: space[1] },
  rule: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: color.hairline },
  actions: { flexDirection: 'row', gap: space[3], alignItems: 'center' },
  timeline: { gap: space[3] },
  timelineEmpty: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.hairline,
    borderRadius: radius.sm,
    borderStyle: 'dashed',
    padding: space[5],
  },
  timelineText: { textAlign: 'center' },
})
