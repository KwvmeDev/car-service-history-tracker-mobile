import { useCallback, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { color, space } from '@revv/tokens'

import { AppText, EmptyState, ErrorState, VehicleCardSkeleton } from '@/ui'
import { GarageSortControl } from '@/features/vehicles/GarageSortControl'
import type { GarageSort } from '@/features/vehicles/api'
import { loadGarageSort, saveGarageSort } from '@/features/vehicles/garage-sort'
import { VehicleCard } from '@/features/vehicles/VehicleCard'
import { useVehicles } from '@/features/vehicles/hooks'

export default function GarageScreen() {
  const router = useRouter()
  const [sort, setSort] = useState<GarageSort>(() => loadGarageSort())
  const { data, isLoading, isError, refetch, isRefetching } = useVehicles(sort)

  const changeSort = useCallback((next: GarageSort) => {
    setSort(next)
    saveGarageSort(next)
  }, [])

  const addVehicle = useCallback(() => {
    router.push('/vehicle/new')
  }, [router])

  const openVehicle = useCallback(
    (id: string) => {
      router.push({ pathname: '/vehicle/[id]', params: { id } })
    },
    [router],
  )

  // A v1 garage is a handful of vehicles (fleet management is out of scope), so a
  // plain scrolling list beats a virtualised FlatList — simpler, and it renders
  // deterministically in tests.
  const vehicles = data ?? []

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Settings"
              onPress={() => {
                router.push('/settings')
              }}
              hitSlop={8}
            >
              <AppText token="label" tone="onNavy">
                Settings
              </AppText>
            </Pressable>
          ),
        }}
      />

      {isLoading ? (
        <View style={styles.list}>
          <VehicleCardSkeleton />
          <VehicleCardSkeleton />
          <VehicleCardSkeleton />
        </View>
      ) : isError ? (
        <ErrorState
          message="We couldn't load your garage. Check your connection and try again."
          onRetry={() => void refetch()}
          retrying={isRefetching}
        />
      ) : vehicles.length === 0 ? (
        <EmptyState
          glyph="🔑"
          title="Your garage is empty"
          body="Add your first vehicle to start building its record."
          actionLabel="Add a vehicle"
          onAction={addVehicle}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={color.navy}
            />
          }
        >
          {vehicles.length >= 2 ? (
            <GarageSortControl value={sort} onChange={changeSort} />
          ) : null}
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onPress={() => {
                openVehicle(vehicle.id)
              }}
            />
          ))}
          <Pressable
            accessibilityRole="button"
            onPress={addVehicle}
            style={styles.addRow}
          >
            <AppText token="body" weight="medium">
              + Add a vehicle
            </AppText>
          </Pressable>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { padding: space.md, gap: space.md },
  addRow: { paddingVertical: space.md, alignItems: 'center' },
})
