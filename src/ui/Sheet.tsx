import { useEffect, useRef, type ReactNode } from 'react'
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import { color, radius, space } from '@revv/tokens'

import { AppText } from './Text'
import { enterTiming, exitTiming } from './motion'

export interface SheetProps {
  visible: boolean
  onDismiss: () => void
  /** Every sheet has a title and a dismiss control (design-system.md §Simplicity). */
  title: string
  children: ReactNode
}

/**
 * A bottom sheet that overlays the current context rather than navigating away.
 * Slides up on `ease.enter`, down on `ease.exit`. Tapping the scrim or the close
 * control dismisses.
 *
 * Stacked sheets must be visibly different heights — that is the caller's job; this
 * component sizes to its content up to ~88% of the screen.
 */
export function Sheet({ visible, onDismiss, title, children }: SheetProps) {
  const slide = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 1 : 0,
      ...(visible ? enterTiming : exitTiming),
    }).start()
  }, [visible, slide])

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [600, 0] })

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <View style={styles.fill}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          style={[StyleSheet.absoluteFill, styles.scrim]}
          onPress={onDismiss}
        />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
            <View style={styles.grabber} />
            <View style={styles.header}>
              <AppText token="title" weight="medium">
                {title}
              </AppText>
              <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onDismiss}>
                <AppText token="body" tone="secondary">
                  Close
                </AppText>
              </Pressable>
            </View>
            {children}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  scrim: { backgroundColor: color.scrim },
  sheet: {
    backgroundColor: color.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: space[5],
    paddingBottom: space[7],
    gap: space[4],
    maxHeight: '88%',
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.hairline,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
})
