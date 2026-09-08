import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { space } from '@revv/tokens'

import { AppText, Button } from '@/ui'
import { resendVerification } from '@/features/auth/email-auth'
import { useSession } from '@/features/auth/use-session'
import { useAuthAction } from '@/features/auth/use-auth-actions'

/**
 * After sign-up (or a sign-in blocked by an unverified email). Better Auth emails a
 * link that opens the app on the `revv://` scheme and verifies; the session then flips
 * to authenticated and the AuthGate moves the user to the garage. The resend button is
 * the manual fallback.
 */
export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ email?: string }>()
  const { user } = useSession()
  const email = params.email ?? user?.email ?? ''
  const { pending, error, run } = useAuthAction()
  const [sent, setSent] = useState(false)

  const resend = () => {
    void run(
      () => resendVerification(email),
      () => {
        setSent(true)
      },
    )
  }

  return (
    <View style={styles.wrap}>
      <AppText token="title">
        Check your email
      </AppText>
      <AppText token="body" tone="secondary" style={styles.body}>
        We sent a verification link to{' '}
        <AppText token="body" weight="medium">
          {email}
        </AppText>
        . Open it on this device to finish setting up your account.
      </AppText>

      {sent ? (
        <AppText token="caption" tone="secondary">
          Sent again. It can take a minute to arrive.
        </AppText>
      ) : null}
      {error != null ? (
        <AppText token="caption" tone="attention">
          {error}
        </AppText>
      ) : null}

      <Button
        label="Resend the link"
        variant="secondary"
        loading={pending}
        onPress={resend}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: space.xl, gap: space.md, justifyContent: 'center' },
  body: { lineHeight: 22 },
})
