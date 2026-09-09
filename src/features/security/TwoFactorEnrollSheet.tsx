import { useState } from 'react'
import { Linking, StyleSheet, View } from 'react-native'
import { color, radius, space } from '@revv/tokens'

import { AppText, Button, Field, Sheet } from '@/ui'

import { useTwoFactor } from './use-two-factor'

export interface TwoFactorEnrollSheetProps {
  visible: boolean
  onDismiss: () => void
}

/**
 * The 2FA enrollment flow (Sprint 8): re-enter the password, then the TOTP secret
 * (as the otpauth link + a manual key) and one-time backup codes, then confirm with
 * a 6-digit code. Inline errors, no toasts; every step shows loading + success.
 */
export function TwoFactorEnrollSheet({ visible, onDismiss }: TwoFactorEnrollSheetProps) {
  const tf = useTwoFactor()
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')

  function close() {
    setPassword('')
    setCode('')
    tf.reset()
    onDismiss()
  }

  return (
    <Sheet visible={visible} title="Turn on two-factor authentication" onDismiss={close}>
      {tf.step === 'password' || tf.step === 'idle' ? (
        <View style={styles.body}>
          <AppText token="body" tone="secondary">
            Confirm your password to start. You&apos;ll add a code from an authenticator app on every
            sign-in.
          </AppText>
          <Field
            label="Password"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
            error={tf.error ?? undefined}
          />
          <Button
            label="Continue"
            block
            loading={tf.pending}
            onPress={() => void tf.submitPassword(password)}
          />
        </View>
      ) : null}

      {tf.step === 'confirm' && tf.enrollment ? (
        <View style={styles.body}>
          <AppText token="label" tone="secondary">
            Add this key to your authenticator app
          </AppText>
          <AppText token="mono" selectable style={styles.key}>
            {tf.enrollment.secret}
          </AppText>
          <Button
            label="Open in an authenticator app"
            variant="secondary"
            onPress={() => void Linking.openURL(tf.enrollment?.totpURI ?? '')}
          />

          <AppText token="label" tone="secondary">
            Save these backup codes somewhere safe — each works once
          </AppText>
          <View style={styles.codes}>
            {tf.enrollment.backupCodes.map((c) => (
              <AppText key={c} token="mono" selectable>
                {c}
              </AppText>
            ))}
          </View>

          <Field
            label="Enter the 6-digit code to finish"
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
            error={tf.error ?? undefined}
          />
          <Button
            label="Turn on two-factor"
            block
            loading={tf.pending}
            onPress={() => void tf.confirmCode(code)}
          />
        </View>
      ) : null}

      {tf.step === 'done' ? (
        <View style={styles.body}>
          <AppText token="body">Two-factor authentication is on.</AppText>
          <Button label="Done" block onPress={close} />
        </View>
      ) : null}
    </Sheet>
  )
}

const styles = StyleSheet.create({
  body: { gap: space.md },
  key: {
    backgroundColor: color.amberWash,
    borderRadius: radius.xs,
    padding: space.sm,
  },
  codes: {
    gap: space.xxs,
    backgroundColor: color.amberWash,
    borderRadius: radius.xs,
    padding: space.sm,
  },
})
