import { useMemo, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'
import { radius, space, type ColorPalette } from '@revv/tokens'

import { AppText, Badge, Button, Card, ErrorState, SearchBar, useThemedStyles, VehicleCardSkeleton } from '@/ui'
import { useSession } from '@/features/auth/use-session'
import { useAllReminders } from '@/features/reminders/hooks'
import { GarageEmptyState } from '@/features/vehicles/GarageEmptyState'
import { matchesVehicleQuery } from '@/features/vehicles/search'
import { useVehicles } from '@/features/vehicles/hooks'
import { VehicleCard } from '@/features/vehicles/VehicleCard'

/** The 1-2 most recently updated vehicles — enough to feel personal without
 *  duplicating the full Vehicles tab. */
const RECENT_COUNT = 2

function firstName(fullName: string): string {
  const trimmed = fullName.trim()
  return trimmed.length > 0 ? (trimmed.split(/\s+/)[0] ?? trimmed) : 'there'
}

function buildStyles(color: ColorPalette) {
  return {
    screen: { flex: 1, backgroundColor: color.canvas },
    hero: {
      backgroundColor: color.blue,
      borderBottomLeftRadius: radius.lg,
      borderBottomRightRadius: radius.lg,
      padding: space.xl,
      paddingTop: space.xxl,
      gap: space.lg,
    },
    content: { padding: space.md, paddingBottom: space.xxxl * 2, gap: space.md },
    noResults: { textAlign: 'center' as const, paddingVertical: space.xl },
    attentionCard: { alignItems: 'center' as const, gap: space.sm },
    centerText: { textAlign: 'center' as const },
    attentionRow: { flexDirection: 'row' as const, gap: space.xs },
    sectionLabel: { marginTop: space.xs },
  }
}

export default function HomeScreen() {
  const { styles } = useThemedStyles(buildStyles)
  const router = useRouter()
  const { user } = useSession()
  const [query, setQuery] = useState('')

  const vehicles = useVehicles()
  const reminders = useAllReminders()

  const searching = query.trim().length > 0
  const results = useMemo(
    () => (vehicles.data ?? []).filter((v) => matchesVehicleQuery(v, query)),
    [vehicles.data, query],
  )
  const recent = useMemo(
    () => [...(vehicles.data ?? [])].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, RECENT_COUNT),
    [vehicles.data],
  )

  const openVehicle = (id: string) => {
    router.push({ pathname: '/vehicle/[id]', params: { id } })
  }

  const overdue = reminders.data.filter((r) => r.status === 'overdue').length
  const dueSoon = reminders.data.filter((r) => r.status === 'due').length
  const isEmpty = (vehicles.data ?? []).length === 0

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <AppText token="display" tone="onBlue">
          Hello, {firstName(user?.name ?? '')}
        </AppText>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Find your vehicle" />
      </View>

      {vehicles.isLoading ? (
        <View style={styles.content}>
          <VehicleCardSkeleton />
        </View>
      ) : vehicles.isError ? (
        <ErrorState
          message="We couldn't load your garage. Check your connection and try again."
          onRetry={() => void vehicles.refetch()}
        />
      ) : isEmpty ? (
        <GarageEmptyState
          onAdd={() => {
            router.push('/vehicle/new')
          }}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {searching ? (
            results.length === 0 ? (
              <AppText token="body" tone="secondary" style={styles.noResults}>
                {`No vehicles match "${query}".`}
              </AppText>
            ) : (
              results.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onPress={() => {
                    openVehicle(vehicle.id)
                  }}
                />
              ))
            )
          ) : (
            <>
              <AppText token="label" tone="secondary">
                Needs attention
              </AppText>
              <Card surface="outline" style={styles.attentionCard}>
                {overdue === 0 && dueSoon === 0 ? (
                  <>
                    <AppText token="heading" style={styles.centerText}>
                      You&rsquo;re all caught up!
                    </AppText>
                    <AppText token="body" tone="secondary" style={styles.centerText}>
                      Nothing due right now.
                    </AppText>
                  </>
                ) : (
                  <View style={styles.attentionRow}>
                    {overdue > 0 ? <Badge label={`${String(overdue)} overdue`} status="overdue" /> : null}
                    {dueSoon > 0 ? <Badge label={`${String(dueSoon)} due soon`} status="due" /> : null}
                  </View>
                )}
                <Button
                  label="View reminders"
                  size="sm"
                  onPress={() => {
                    router.push('/reminders')
                  }}
                />
              </Card>

              <AppText token="label" tone="secondary" style={styles.sectionLabel}>
                Recently viewed
              </AppText>
              {recent.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onPress={() => {
                    openVehicle(vehicle.id)
                  }}
                />
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  )
}
