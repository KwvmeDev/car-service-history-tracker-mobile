import { useCallback } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { color, space } from '@revv/tokens'

import { AppText, EmptyState, ErrorState, VehicleCardSkeleton } from '@/ui'
import { useSignOut } from '@/features/auth/use-session'
import { VehicleCard } from '@/features/vehicles/VehicleCard'
import { useVehicles } from '@/features/vehicles/hooks'

export default function GarageScreen() {
  const router = useRouter()
  const signOut = useSignOut()
  const { data, isLoading, isError, refetch, isRefetching } = useVehicles()

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
              accessibilityLabel="Sign out"
              onPress={() => void signOut()}
              hitSlop={8}
            >
              <AppText token="label" tone="onNavy">
                Sign out
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
  list: { padding: space[4], gap: space[4] },
  addRow: { paddingVertical: space[4], alignItems: 'center' },
})
