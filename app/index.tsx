import { useEffect, useRef, useState } from 'react'
import { Animated, View, type ImageSourcePropType } from 'react-native'
import { Redirect } from 'expo-router'
import type { ColorPalette } from '@revv/tokens'

import { useSession } from '@/features/auth/use-session'
import { hasSeenOnboarding } from '@/features/onboarding/onboarding-store'
import { durEnter, easeEnter, useReducedMotion } from '@/ui/motion'
import { useThemedStyles } from '@/ui/theme'

// eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro requires a static require() for images
const LOGOMARK = require('../assets/brand/logomark.png') as ImageSourcePropType

/**
 * Entry route. Three-way branch, in order: still resolving (session and/or the
 * onboarding flag) -> the branded loading screen; never onboarded on this
 * device -> the onboarding carousel; otherwise the existing session-based
 * redirect (ADR 0003 — a warm start resolves from SecureStore with no spinner).
 */
export default function Index() {
  const { status } = useSession()
  const [onboarded, setOnboarded] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true
    hasSeenOnboarding()
      .then((seen) => {
        if (mounted) setOnboarded(seen)
      })
      .catch(() => {
        if (mounted) setOnboarded(true) // fail open — never trap a user on a broken read
      })
    return () => {
      mounted = false
    }
  }, [])

  if (status === 'loading' || onboarded === null) {
    return <LoadingScreen />
  }

  if (!onboarded) {
    return <Redirect href="/onboarding/1" />
  }

  return <Redirect href={status === 'authenticated' ? '/home' : '/sign-in'} />
}

/** The Revv logomark on a quiet settle-in — replaces the old bare spinner. */
function LoadingScreen() {
  const { styles } = useThemedStyles(buildStyles)
  const reducedMotion = useReducedMotion()
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.92)).current

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(1)
      scale.setValue(1)
      return
    }
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: durEnter, easing: easeEnter, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: durEnter, easing: easeEnter, useNativeDriver: true }),
    ]).start()
  }, [reducedMotion, opacity, scale])

  return (
    <View style={styles.center}>
      <Animated.Image
        source={LOGOMARK}
        style={[styles.logo, { opacity, transform: [{ scale }] }]}
        resizeMode="contain"
      />
    </View>
  )
}

function buildStyles(color: ColorPalette) {
  return {
    center: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: color.canvas },
    logo: { width: 96, height: 96 },
  }
}
