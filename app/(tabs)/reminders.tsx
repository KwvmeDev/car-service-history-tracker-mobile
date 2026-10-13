import { ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'
import { space, type ColorPalette } from '@revv/tokens'

import { AppText, EmptyState, ErrorState, Skeleton, useThemedStyles } from '@/ui'
import { AllReminderRow } from '@/features/reminders/AllReminderRow'
import { useAllReminders, type ReminderWithVehicle } from '@/features/reminders/hooks'
import { useVehicles } from '@/features/vehicles/hooks'

function Section({ title, rows, onPress }: {
  title: string
  rows: ReminderWithVehicle[]
  onPress: (vehicleId: string) => void
}) {
  const { styles } = useThemedStyles(buildStyles)
  if (rows.length === 0) return null
  return (
    <View style={styles.section}>
      <AppText token="label" tone="secondary">
        {title}
      </AppText>
      {rows.map((reminder) => (
        <AllReminderRow
          key={reminder.id}
          reminder={reminder}
          onPress={() => {
            onPress(reminder.vehicleId)
          }}
        />
      ))}
    </View>
  )
}

export default function RemindersScreen() {
  const { styles } = useThemedStyles(buildStyles)
  const router = useRouter()
  const vehicles = useVehicles()
  const reminders = useAllReminders()

  const openVehicle = (vehicleId: string) => {
    router.push({ pathname: '/vehicle/[id]', params: { id: vehicleId } })
  }

  const overdue = reminders.data.filter((r) => r.status === 'overdue')
  const due = reminders.data.filter((r) => r.status === 'due')
  const upcoming = reminders.data.filter((r) => r.status === 'ok')

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <AppText token="title">Reminders</AppText>
      </View>

      {reminders.isLoading ? (
        <View style={styles.list}>
          <Skeleton width="70%" height={16} />
          <Skeleton width="50%" height={12} />
          <Skeleton width="60%" height={16} />
        </View>
      ) : reminders.isError ? (
        <ErrorState
          message="We couldn't load your reminders. Check your connection and try again."
          onRetry={reminders.refetch}
        />
      ) : vehicles.data?.length === 0 ? (
        <EmptyState
          glyph="🔔"
          title="No vehicles yet"
          body="Add a vehicle to start tracking its service reminders."
          actionLabel="Add a vehicle"
          onAction={() => {
            router.push('/vehicle/new')
          }}
        />
      ) : reminders.data.length === 0 ? (
        <EmptyState
          glyph="✅"
          title="All caught up"
          body="No reminders due across any of your vehicles right now."
          actionLabel="Open a vehicle"
          onAction={() => {
            router.push('/(tabs)/vehicles')
          }}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <Section title="Overdue" rows={overdue} onPress={openVehicle} />
          <Section title="Due soon" rows={due} onPress={openVehicle} />
          <Section title="On track" rows={upcoming} onPress={openVehicle} />
        </ScrollView>
      )}
    </View>
  )
}

function buildStyles(color: ColorPalette) {
  return {
    screen: { flex: 1, backgroundColor: color.canvas },
    header: { paddingHorizontal: space.md, paddingTop: space.lg, paddingBottom: space.sm },
    list: { padding: space.md, paddingBottom: space.xxxl * 2, gap: space.lg },
    section: { gap: space.xxs },
  }
}
