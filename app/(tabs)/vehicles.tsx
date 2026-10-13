import { useCallback, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'
import { space, type ColorPalette } from '@revv/tokens'

import { AppText, ErrorState, SearchBar, VehicleCardSkeleton, useThemedStyles } from '@/ui'
import { GarageEmptyState } from '@/features/vehicles/GarageEmptyState'
import { GarageSortControl } from '@/features/vehicles/GarageSortControl'
import { matchesVehicleQuery } from '@/features/vehicles/search'
import type { GarageSort } from '@/features/vehicles/api'
import { loadGarageSort, saveGarageSort } from '@/features/vehicles/garage-sort'
import { VehicleCard } from '@/features/vehicles/VehicleCard'
import { useVehicles } from '@/features/vehicles/hooks'

export default function VehiclesScreen() {
  const { color, styles } = useThemedStyles(buildStyles)
  const router = useRouter()
  const [sort, setSort] = useState<GarageSort>(() => loadGarageSort())
  const [query, setQuery] = useState('')
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
  const searching = query.trim().length > 0
  const filtered = vehicles.filter((v) => matchesVehicleQuery(v, query))

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <AppText token="title">Vehicles</AppText>
        {vehicles.length > 0 ? (
          <SearchBar value={query} onChangeText={setQuery} placeholder="Find your vehicle" style={styles.search} />
        ) : null}
      </View>

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
        <GarageEmptyState onAdd={addVehicle} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={color.blue}
            />
          }
        >
          {!searching && vehicles.length >= 2 ? (
            <GarageSortControl value={sort} onChange={changeSort} />
          ) : null}
          {searching && filtered.length === 0 ? (
            <AppText token="body" tone="secondary" style={styles.noResults}>
              {`No vehicles match "${query}".`}
            </AppText>
          ) : (
            filtered.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onPress={() => {
                  openVehicle(vehicle.id)
                }}
              />
            ))
          )}
          <Pressable accessibilityRole="button" onPress={addVehicle} style={styles.addRow}>
            <AppText token="body" weight="medium">
              + Add a vehicle
            </AppText>
          </Pressable>
        </ScrollView>
      )}
    </View>
  )
}

function buildStyles(color: ColorPalette) {
  return {
    screen: { flex: 1, backgroundColor: color.canvas },
    header: { paddingHorizontal: space.md, paddingTop: space.lg, paddingBottom: space.sm, gap: space.md },
    search: { marginTop: space.xxs },
    list: { padding: space.md, paddingBottom: space.xxxl * 2, gap: space.md },
    noResults: { textAlign: 'center' as const, paddingVertical: space.xl },
    addRow: { paddingVertical: space.md, alignItems: 'center' as const },
  }
}
