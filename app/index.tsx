import { Redirect } from 'expo-router'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { color } from '@revv/tokens'

import { useSession } from '@/features/auth/use-session'

/**
 * Entry route. Sends the viewer to the garage or to sign-in based on the session,
 * which a warm start resolves from SecureStore with no spinner (ADR 0003).
 */
export default function Index() {
  const { status } = useSession()

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={color.navy} />
      </View>
    )
  }

  return <Redirect href={status === 'authenticated' ? '/garage' : '/sign-in'} />
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.white },
})
