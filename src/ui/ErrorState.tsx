import { StyleSheet, View } from 'react-native'
import { space } from '@revv/tokens'

import { AppText } from './Text'
import { Button } from './Button'

export interface ErrorStateProps {
  /** Short, human, safe to show — never a stack trace or a status code. */
  message?: string
  onRetry: () => void
  retrying?: boolean
}

/**
 * design-system.md — errors are inline and actionable, never a bare toast. A plain
 * explanation and a retry. The default copy covers the common "couldn't reach the
 * server" case.
 */
export function ErrorState({
  message = "We couldn't load this. Check your connection and try again.",
  onRetry,
  retrying = false,
}: ErrorStateProps) {
  return (
    <View style={styles.wrap}>
      <AppText token="body" style={styles.message}>
        {message}
      </AppText>
      <Button label="Try again" variant="secondary" loading={retrying} onPress={onRetry} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[4], padding: space[5] },
  message: { textAlign: 'center', maxWidth: 300 },
})
