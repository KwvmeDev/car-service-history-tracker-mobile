import { StyleSheet, View } from 'react-native'

import { Button } from '@/ui'

import { isAppleEnabled, isGoogleEnabled } from './config'
import { signInWithApple, signInWithGoogle } from './social'
import { useAuthAction } from './use-auth-actions'
import { AppText } from '@/ui/Text'
import { space } from '@revv/tokens'

/**
 * Google / Apple sign-in buttons. Each renders only when its provider is configured
 * (config.ts) — no dead buttons while the OAuth credentials are still pending
 * (scaffold-plan §0). If neither is configured this renders nothing.
 */
export function SocialButtons({ onSignedIn }: { onSignedIn: () => void }) {
  const google = useAuthAction()
  const apple = useAuthAction()

  if (!isGoogleEnabled && !isAppleEnabled) return null

  return (
    <View style={styles.wrap}>
      <View style={styles.divider}>
        <AppText token="caption" tone="secondary">
          or
        </AppText>
      </View>
      {isGoogleEnabled ? (
        <Button
          label="Continue with Google"
          variant="secondary"
          loading={google.pending}
          onPress={() => void google.run(signInWithGoogle, onSignedIn)}
        />
      ) : null}
      {isAppleEnabled ? (
        <Button
          label="Continue with Apple"
          variant="secondary"
          loading={apple.pending}
          onPress={() => void apple.run(signInWithApple, onSignedIn)}
        />
      ) : null}
      {google.error != null ? (
        <AppText token="caption" tone="attention">
          {google.error}
        </AppText>
      ) : null}
      {apple.error != null ? (
        <AppText token="caption" tone="attention">
          {apple.error}
        </AppText>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: space[3], alignSelf: 'stretch' },
  divider: { alignItems: 'center', paddingVertical: space[2] },
})
