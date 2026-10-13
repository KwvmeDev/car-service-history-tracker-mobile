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
import { radius, shadow, space, type ColorPalette } from '@revv/tokens'

import { AppText } from './Text'
import { enterTiming, exitTiming } from './motion'
import { useThemedStyles } from './theme'

export interface SheetProps {
  visible: boolean
  onDismiss: () => void
  /** Every sheet has a title and a dismiss control (design-system.md §Simplicity). */
  title: string
  children: ReactNode
}

function buildStyles(color: ColorPalette) {
  return {
    fill: { flex: 1, justifyContent: 'flex-end' as const },
    scrim: { backgroundColor: color.scrim },
    sheet: {
      backgroundColor: color.canvas,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      padding: space.xl,
      paddingBottom: space.band,
      gap: space.md,
      maxHeight: '88%' as const,
      ...shadow.xl.native,
    },
    grabber: {
      alignSelf: 'center' as const,
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: color.hairline,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
    },
  }
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
  const { styles } = useThemedStyles(buildStyles)
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
              <AppText token="title">{title}</AppText>
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
