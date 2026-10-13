import { useMemo, useRef, useState } from 'react'
import { Animated, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Stack, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { radius, space, type ColorPalette } from '@revv/tokens'

import { AppText, Badge, Button, Card, CountUp, ErrorState, Skeleton, StatRow, useThemedStyles } from '@/ui'
import { enterTiming } from '@/ui/motion'
import { isPending } from '@/data/pending'
import { AuctionHistoryLink } from '@/features/vehicles/AuctionHistoryLink'
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

const PHOTO_HEIGHT = 180

function buildStyles(color: ColorPalette) {
  return {
    screen: { flex: 1, backgroundColor: color.canvas },
    content: { padding: space.md, gap: space.md },
    headerSkeleton: {
      backgroundColor: color.canvas,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: color.hairline,
      borderRadius: radius.md,
      padding: space.md,
      gap: space.sm,
      margin: space.md,
    },
    heroCard: { gap: space.sm },
    photo: { width: '100%' as const, height: PHOTO_HEIGHT, borderRadius: radius.sm },
    photoPlaceholder: {
      width: '100%' as const,
      height: PHOTO_HEIGHT,
      borderRadius: radius.sm,
      backgroundColor: color.blueWash,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    identityRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
      gap: space.sm,
    },
    identity: { flex: 1, gap: space.xxs },
    titleRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: space.xs },
    titleText: { flexShrink: 1 },
    editButton: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: color.hairline,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: color.hairline },
    statsRow: { flexDirection: 'row' as const, alignItems: 'flex-start' as const },
    stat: { flex: 1, gap: space.xxs },
    rule: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch' as const, backgroundColor: color.hairline },
    reportCta: { gap: space.xs, marginTop: space.sm },
    reportHint: { textAlign: 'center' as const },
  }
}

export default function VehicleProfileScreen() {
  const { color, styles } = useThemedStyles(buildStyles)
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
        style={{
          gap: space.sm,
          opacity: printIn,
          transform: [
            { translateY: printIn.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
          ],
        }}
      >
        <Card surface="outline" nativeID={`vehicle-card-${vehicle.id}`} style={styles.heroCard}>
          {vehicle.photoUrl != null ? (
            <Image source={{ uri: vehicle.photoUrl }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="car-sport-outline" size={40} color={color.hairline} />
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <CountUp value={vehicle.currentMileage ?? 0} />
              <AppText token="caption" tone="secondary">
                Mileage{vehicle.mileageUnit === 'km' ? ' (km)' : ''}
              </AppText>
            </View>
            <View style={styles.rule} />
            <View style={styles.stat}>
              <CountUp value={recordCount} />
              <AppText token="caption" tone="secondary">
                Records
              </AppText>
            </View>
            <View style={styles.rule} />
            <View style={styles.stat}>
              <StatRow
                surface="white"
                stats={[
                  {
                    label: 'Owned since',
                    value: vehicle.ownedSince != null ? String(new Date(vehicle.ownedSince).getFullYear()) : '—',
                  },
                ]}
              />
            </View>
          </View>
        </Card>

        <View style={styles.identityRow}>
          <View style={styles.identity}>
            <View style={styles.titleRow}>
              <AppText token="display" numberOfLines={1} style={styles.titleText}>
                {title}
              </AppText>
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
              <AppText token="body" tone="secondary">
                {[vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(' ')}
              </AppText>
            ) : null}
            {vehicle.vin != null ? (
              <AppText token="mono" tone="secondary">
                {vehicle.vin}
              </AppText>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit vehicle"
            onPress={() => {
              setEditingVehicle(true)
            }}
            style={styles.editButton}
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={20} color={color.blue} />
          </Pressable>
        </View>

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
        {vehicle.vin != null ? <AuctionHistoryLink vin={vehicle.vin} /> : null}
      </Animated.View>

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
          label="Generate resale report"
          icon={<Ionicons name="document-text-outline" size={18} color={color.white} />}
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
