import { useState } from 'react'
import { Linking, ScrollView, StyleSheet, View } from 'react-native'
import Constants from 'expo-constants'
import { space } from '@revv/tokens'

import { AppText, Badge, Button, ErrorState, Field, Skeleton } from '@/ui'
import { authClient } from '@/features/auth/auth-client'
import { useSignOut } from '@/features/auth/use-session'
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/features/notifications/preferences-hooks'
import { TwoFactorEnrollSheet } from '@/features/security/TwoFactorEnrollSheet'
import { useTwoFactor } from '@/features/security/use-two-factor'

import { SettingsSection, SettingsRow, SettingsToggle } from './sections'

const PRIVACY_URL = 'https://revv.app/privacy'
const TERMS_URL = 'https://revv.app/terms'
const SUPPORT_MAILTO = 'mailto:hello@klevrhq.com'

/** Quiet hours as a single 10pm–7am toggle (minutes past midnight). */
const QUIET_START = 22 * 60
const QUIET_END = 7 * 60

interface SessionShape {
  data?: { user?: { name?: string; email?: string; emailVerified?: boolean } } | null
  isPending?: boolean
}

export function SettingsScreen() {
  const session = authClient.useSession() as SessionShape
  const user = session.data?.user
  const signOut = useSignOut()

  const prefs = useNotificationPreferences()
  const updatePrefs = useUpdateNotificationPreferences()
  const tf = useTwoFactor()

  const [enrollOpen, setEnrollOpen] = useState(false)
  const [disablePassword, setDisablePassword] = useState('')
  const [disableOpen, setDisableOpen] = useState(false)

  const p = prefs.data
  const quietOn = p?.quietHoursStart != null && p.quietHoursEnd != null

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {/* Account */}
      <SettingsSection title="Account">
        {session.isPending ? (
          <View style={styles.pad}>
            <Skeleton width="60%" height={16} />
          </View>
        ) : (
          <>
            <SettingsRow
              label={user?.name ?? 'Your account'}
              hint={user?.email}
              right={
                user?.emailVerified ? <Badge label="Verified" status="neutral" /> : <Badge label="Unverified" status="due" />
              }
            />
            <SettingsRow label="Sign out" onPress={() => void signOut()} />
            <SettingsRow label="Delete account" hint="Coming soon — contact support to close your account" />
          </>
        )}
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection title="Notifications">
        {prefs.isLoading ? (
          <View style={styles.pad}>
            <Skeleton width="50%" height={16} />
          </View>
        ) : prefs.isError ? (
          <ErrorState message="We couldn't load your notification settings." onRetry={() => void prefs.refetch()} />
        ) : p ? (
          <>
            <SettingsToggle
              label="Upcoming service"
              hint="A heads-up weeks before a reminder is due"
              value={p.remindersUpcoming}
              onValueChange={(v) => {
                updatePrefs.mutate({ remindersUpcoming: v })
              }}
            />
            <SettingsToggle
              label="Due soon"
              value={p.remindersDue}
              onValueChange={(v) => {
                updatePrefs.mutate({ remindersDue: v })
              }}
            />
            <SettingsToggle
              label="Overdue"
              value={p.remindersOverdue}
              onValueChange={(v) => {
                updatePrefs.mutate({ remindersOverdue: v })
              }}
            />
            <SettingsToggle
              label="Quiet hours"
              hint="Hold notifications between 10pm and 7am"
              value={quietOn}
              onValueChange={(v) => {
                updatePrefs.mutate(
                  v
                    ? { quietHoursStart: QUIET_START, quietHoursEnd: QUIET_END }
                    : { quietHoursStart: null, quietHoursEnd: null },
                )
              }}
            />
          </>
        ) : null}
      </SettingsSection>

      {/* Security */}
      <SettingsSection title="Security">
        <SettingsRow
          label="Two-factor authentication"
          hint={tf.enabled ? 'On — a code is required on every sign-in' : 'Off'}
          right={tf.enabled ? <Badge label="On" status="neutral" /> : undefined}
        />
        <View style={styles.pad}>
          {tf.enabled ? (
            disableOpen ? (
              <View style={styles.gap}>
                <AppText token="body" tone="secondary">
                  Enter your password to turn off two-factor authentication.
                </AppText>
                <Field
                  label="Password"
                  secureTextEntry
                  autoCapitalize="none"
                  value={disablePassword}
                  onChangeText={setDisablePassword}
                  error={tf.error ?? undefined}
                />
                <Button
                  label="Turn off two-factor"
                  variant="secondary"
                  loading={tf.pending}
                  onPress={() => {
                    void tf.disable(disablePassword).then((done) => {
                      if (done) {
                        setDisableOpen(false)
                        setDisablePassword('')
                      }
                    })
                  }}
                />
              </View>
            ) : (
              <Button label="Turn off two-factor" variant="text" onPress={() => { setDisableOpen(true) }} />
            )
          ) : (
            <Button
              label="Set up two-factor"
              variant="secondary"
              onPress={() => {
                tf.start()
                setEnrollOpen(true)
              }}
            />
          )}
        </View>
      </SettingsSection>

      {/* About */}
      <SettingsSection title="About">
        <SettingsRow label="Version" hint={Constants.expoConfig?.version ?? '0.1.0'} />
        <SettingsRow label="Privacy policy" onPress={() => void Linking.openURL(PRIVACY_URL)} />
        <SettingsRow label="Terms of service" onPress={() => void Linking.openURL(TERMS_URL)} />
        <SettingsRow label="Contact support" onPress={() => void Linking.openURL(SUPPORT_MAILTO)} />
      </SettingsSection>

      <TwoFactorEnrollSheet
        visible={enrollOpen}
        onDismiss={() => {
          setEnrollOpen(false)
        }}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: space.md, gap: space.lg },
  pad: { padding: space.md },
  gap: { gap: space.sm },
})
