import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native'

import { Button } from '@/ui'

import { isAppleEnabled, isGoogleEnabled } from './config'
import { signInWithApple, signInWithGoogle } from './social'
import { useAuthAction } from './use-auth-actions'
import { AppText } from '@/ui/Text'
import { space } from '@revv/tokens'

// eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro requires a static require() for images
const GOOGLE_LOGO = require('../../../assets/brand/google-logo.png') as ImageSourcePropType

/**
 * Google / Apple sign-in buttons. Each renders only when its provider is configured
 * (config.ts) — no dead buttons while the OAuth credentials are still pending
 * (scaffold-plan §0). If neither is configured this renders nothing.
 *
 * Google's mark is its own official multi-colour "G" (their brand guidelines
 * require the full-colour version, not a monochrome one, on a light button) —
 * a PNG export rather than react-native-svg, same zero-new-native-dependency
 * call as the onboarding illustrations and the Revv logomark.
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
          icon={<Image source={GOOGLE_LOGO} style={styles.googleIcon} resizeMode="contain" />}
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
  wrap: { gap: space.sm, alignSelf: 'stretch' },
  divider: { alignItems: 'center', paddingVertical: space.xs },
  googleIcon: { width: 18, height: 18 },
})
