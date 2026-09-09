import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { space } from '@revv/tokens'

import { AppText, Button, Field } from '@/ui'

import { useTwoFactorChallenge } from './use-two-factor'

export interface TwoFactorChallengeProps {
  /** Called once the challenge is resolved and the session is issued. */
  onVerified: () => void
}

/**
 * The sign-in 2FA step (Sprint 8). Shown when a password sign-in returns a
 * `twoFactorRedirect`. A 6-digit authenticator code, or a one-time backup code.
 * Wrong code → inline error, no layout shift.
 */
export function TwoFactorChallenge({ onVerified }: TwoFactorChallengeProps) {
  const challenge = useTwoFactorChallenge()
  const [code, setCode] = useState('')
  const [useBackup, setUseBackup] = useState(false)

  return (
    <View style={styles.wrap}>
      <AppText token="heading">Enter your verification code</AppText>
      <AppText token="body" tone="secondary">
        {useBackup
          ? 'Enter one of the backup codes you saved when you set up two-factor.'
          : 'Open your authenticator app and enter the 6-digit code for Revv.'}
      </AppText>

      <Field
        label={useBackup ? 'Backup code' : 'Authenticator code'}
        keyboardType={useBackup ? 'default' : 'number-pad'}
        autoCapitalize="none"
        value={code}
        onChangeText={setCode}
        error={challenge.error ?? undefined}
      />

      <Button
        label="Verify"
        block
        loading={challenge.pending}
        onPress={() => void challenge.submit(code.trim(), useBackup, onVerified)}
      />
      <Button
        label={useBackup ? 'Use an authenticator code instead' : 'Use a backup code instead'}
        variant="text"
        onPress={() => {
          setUseBackup((v) => !v)
          setCode('')
          challenge.clearError()
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
})
