import { Image, Pressable, View, useColorScheme } from 'react-native'
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router'
import { radius, space, type ColorPalette } from '@revv/tokens'

import { AppText, Button, useThemedStyles } from '@/ui'
import { markOnboardingSeen } from '@/features/onboarding/onboarding-store'
import { ONBOARDING_STEPS } from '@/features/onboarding/steps'

/**
 * First-launch onboarding (three steps, gated by onboarding-store's SecureStore
 * flag — see app/index.tsx). A single dynamic route over `ONBOARDING_STEPS`
 * rather than three files, so reordering/adding a step is a data change, not a
 * routing change (matches the app/vehicle/[id] pattern for dynamic segments).
 *
 * Forward is `push` (native swipe-back / hardware back returns to the previous
 * step, no back button needed); finishing or skipping is `replace` into
 * sign-in so onboarding can't be swiped back into once done.
 */
function buildStyles(color: ColorPalette) {
  return {
    page: {
      flex: 1,
      backgroundColor: color.canvas,
      padding: space.xl,
      gap: space.lg,
    },
    skip: {
      position: 'absolute' as const,
      top: space.lg,
      right: space.lg,
      zIndex: 1,
      padding: space.xs,
    },
    imageWrap: {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginTop: space.xl,
    },
    image: { width: '100%' as const, height: '100%' as const },
    content: { gap: space.xxs },
    dots: { flexDirection: 'row' as const, justifyContent: 'center' as const, gap: space.xs },
    dot: {
      width: 6,
      height: 6,
      borderRadius: radius.full,
      backgroundColor: color.hairline,
    },
    dotActive: {
      backgroundColor: color.blue,
      width: 18,
    },
  }
}

export default function OnboardingStepScreen() {
  const { color, styles } = useThemedStyles(buildStyles)
  const dark = useColorScheme() === 'dark'
  const { step } = useLocalSearchParams<{ step: string }>()
  const router = useRouter()
  const index = Number(step) - 1

  const data = Number.isInteger(index) ? ONBOARDING_STEPS[index] : undefined
  if (!data) {
    return <Redirect href="/onboarding/1" />
  }
  const isLast = index === ONBOARDING_STEPS.length - 1

  async function finish(): Promise<void> {
    await markOnboardingSeen()
    router.replace('/sign-in')
  }

  async function next(): Promise<void> {
    if (isLast) {
      await finish()
    } else {
      router.push(`/onboarding/${String(index + 2)}`)
    }
  }

  return (
    <View style={styles.page}>
      <Pressable
        onPress={() => void finish()}
        style={styles.skip}
        hitSlop={space.sm}
        accessibilityRole="button"
      >
        <AppText token="label" tone="secondary">
          Skip
        </AppText>
      </Pressable>

      <View style={styles.imageWrap}>
        <Image
          source={data.image}
          style={styles.image}
          resizeMode="contain"
          tintColor={data.lineArt && dark ? color.ink : undefined}
        />
      </View>

      <View style={styles.content}>
        <AppText token="caption" tone="secondary">
          {data.eyebrow}
        </AppText>
        <AppText token="title" weight="bold">
          {data.title}
        </AppText>
        <AppText token="body" tone="secondary">
          {data.body}
        </AppText>
      </View>

      <View style={styles.dots} accessibilityElementsHidden>
        {ONBOARDING_STEPS.map((s, i) => (
          <View key={s.key} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <Button label={data.cta} block onPress={() => void next()} />
    </View>
  )
}

