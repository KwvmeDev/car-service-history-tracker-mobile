import { useMemo, useRef, useState } from 'react'
import { Animated, Image, ScrollView, StyleSheet, View } from 'react-native'
import { Stack, useLocalSearchParams } from 'expo-router'
import { color, radius, space } from '@revv/tokens'

import { AppText, Badge, Button, CountUp, ErrorState, Skeleton, StatRow } from '@/ui'
import { enterTiming } from '@/ui/motion'
import { isPending } from '@/data/pending'
import { EditVehicleSheet } from '@/features/vehicles/EditVehicleSheet'
import { useDecodeVin, useVehicle } from '@/features/vehicles/hooks'
import { vehicleTitle } from '@/features/vehicles/types'
import { Timeline } from '@/features/service-records/Timeline'
import { LogServiceSheet } from '@/features/service-records/LogServiceSheet'
import { useServiceRecords } from '@/features/service-records/hooks'
import { useAttachmentUploadQueue } from '@/features/attachments/hooks'
import { Reminders } from '@/features/reminders/Reminders'
import { ReminderSheet } from '@/features/reminders/ReminderSheet'
import { useReminders, worstStatus } from '@/features/reminders/hooks'
import { useReminderNotifications } from '@/features/reminders/use-reminder-notifications'
import { GenerateReportFlow } from '@/features/reports/GenerateReportFlow'
import { ReportsSheet } from '@/features/reports/ReportsSheet'
import { ShopAccessSheet } from '@/features/mechanic/ShopAccessSheet'
import { ShopSubmissions } from '@/features/mechanic/ShopSubmissions'

export default function VehicleProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: vehicle, isLoading, isError, refetch, isPlaceholderData } = useVehicle(id)
  const decode = useDecodeVin(id)
  const records = useServiceRecords(id)
  const reminders = useReminders(id)
  useAttachmentUploadQueue()
  useReminderNotifications(id, vehicle ? vehicleTitle(vehicle) : '')

  const [editingVehicle, setEditingVehicle] = useState(false)
  const [logging, setLogging] = useState(false)
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)
  const [addingReminder, setAddingReminder] = useState(false)
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null)
  const [reportsOpen, setReportsOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [regenerateId, setRegenerateId] = useState<string | null>(null)
  const [shopAccessOpen, setShopAccessOpen] = useState(false)

  const editingRecord = useMemo(
    () => records.data?.find((r) => r.id === editingRecordId),
    [records.data, editingRecordId],
  )
  const editingReminder = useMemo(
    () => reminders.data?.find((r) => r.id === editingReminderId),
    [reminders.data, editingReminderId],
  )
  const reminderAttention = worstStatus(reminders.data)

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
  const recordCount = records.data?.length ?? 0

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
          {vehicle.photoUrl != null ? (
            <Image source={{ uri: vehicle.photoUrl }} style={styles.photo} />
          ) : null}
          <View style={styles.identity}>
            <AppText token="display" tone="onBlue">
              {title}
            </AppText>
            {vehicle.vin != null ? (
              <AppText token="mono" tone="onBlueSubtle">
                {vehicle.vin}
              </AppText>
            ) : null}
          </View>
          {pending ? (
            <Badge label="Not synced" status="due" />
          ) : reminderAttention !== 'ok' ? (
            <Badge
              label={reminderAttention === 'overdue' ? 'Service overdue' : 'Service due'}
              status={reminderAttention === 'overdue' ? 'overdue' : 'due'}
            />
          ) : null}
        </View>

        {vehicle.year != null || vehicle.make != null ? (
          <AppText token="body" tone="onBlueSubtle">
            {[vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(' ')}
          </AppText>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <CountUp value={vehicle.currentMileage ?? 0} tone="onBlue" />
            <AppText token="caption" tone="onBlueSubtle">
              Mileage{vehicle.mileageUnit === 'km' ? ' (km)' : ''}
            </AppText>
          </View>
          <View style={styles.rule} />
          <View style={styles.stat}>
            <CountUp value={recordCount} tone="onBlue" />
            <AppText token="caption" tone="onBlueSubtle">
              Records
            </AppText>
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
            setEditingVehicle(true)
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

      <ShopSubmissions vehicleId={id} />

      <Timeline
        vehicleId={id}
        onAddPress={() => {
          setLogging(true)
        }}
        onEntryPress={setEditingRecordId}
      />

      <Reminders
        vehicleId={id}
        onAddPress={() => {
          setAddingReminder(true)
        }}
        onEditPress={setEditingReminderId}
      />

      <View style={styles.reportCta}>
        <Button
          label="Resale report"
          block
          onPress={() => {
            setReportsOpen(true)
          }}
        />
        <AppText token="caption" tone="secondary" style={styles.reportHint}>
          Turn this history into a document a buyer can open in any browser.
        </AppText>
        <Button
          label="Shop access"
          variant="text"
          onPress={() => {
            setShopAccessOpen(true)
          }}
        />
      </View>

      <ShopAccessSheet
        vehicleId={id}
        vehicleLabel={title}
        visible={shopAccessOpen}
        onDismiss={() => {
          setShopAccessOpen(false)
        }}
      />

      <EditVehicleSheet
        vehicle={vehicle}
        visible={editingVehicle}
        onDismiss={() => {
          setEditingVehicle(false)
        }}
      />
      <LogServiceSheet
        key={logging ? 'log-open' : 'log-closed'}
        vehicleId={id}
        visible={logging}
        onDismiss={() => {
          setLogging(false)
        }}
      />
      <LogServiceSheet
        vehicleId={id}
        visible={editingRecord != null}
        record={editingRecord}
        onDismiss={() => {
          setEditingRecordId(null)
        }}
      />
      <ReminderSheet
        key={addingReminder ? 'reminder-open' : 'reminder-closed'}
        vehicleId={id}
        visible={addingReminder}
        onDismiss={() => {
          setAddingReminder(false)
        }}
      />
      <ReminderSheet
        vehicleId={id}
        visible={editingReminder != null}
        reminder={editingReminder}
        onDismiss={() => {
          setEditingReminderId(null)
        }}
      />

      <ReportsSheet
        vehicleId={id}
        visible={reportsOpen}
        onDismiss={() => {
          setReportsOpen(false)
        }}
        onGenerate={() => {
          setReportsOpen(false)
          setRegenerateId(null)
          setGenerating(true)
        }}
        onRegenerate={(reportId) => {
          setReportsOpen(false)
          setRegenerateId(reportId)
          setGenerating(true)
        }}
      />
      <GenerateReportFlow
        vehicleId={id}
        vehicleTitle={title}
        visible={generating}
        regenerateId={regenerateId ?? undefined}
        onDismiss={() => {
          setGenerating(false)
          setRegenerateId(null)
        }}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.white },
  content: { padding: space.md, gap: space.md },
  header: { backgroundColor: color.blue, borderRadius: radius.md, padding: space.md, gap: space.sm },
  headerSkeleton: {
    backgroundColor: color.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.hairline,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.sm,
    margin: space.md,
  },
  identityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.xs },
  photo: { width: 56, height: 56, borderRadius: radius.sm, backgroundColor: 'rgba(255,255,255,0.15)' },
  identity: { flex: 1, gap: space.xxs },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: color.hairline },
  statsRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stat: { flex: 1, gap: space.xxs },
  rule: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: color.hairline },
  actions: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  reportCta: { gap: space.xs, marginTop: space.sm },
  reportHint: { textAlign: 'center' },
})
