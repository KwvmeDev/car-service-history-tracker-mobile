// MUST be the first import in the app: polyfills crypto.getRandomValues, which
// Hermes doesn't provide and uuid's v7() (src/data/ids.ts, every client-minted
// id — ADR 0004) needs. Anything importing uuid before this runs throws
// "crypto.getRandomValues() not supported".
import 'react-native-get-random-values'

import { useEffect } from 'react'
import { View, useColorScheme } from 'react-native'
import {
  AlbertSans_400Regular,
  AlbertSans_500Medium,
  AlbertSans_600SemiBold,
  AlbertSans_700Bold,
} from '@expo-google-fonts/albert-sans'
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono'
import { useFonts } from 'expo-font'
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { text } from '@revv/tokens'

import { QueryProvider } from '@/data/QueryProvider'
import { useSession } from '@/features/auth/use-session'
import { usePushRegistration } from '@/features/notifications/use-push-registration'
import { configureReminderNotifications } from '@/features/reminders/notifications'
import { applyThemePreference, loadThemePreference } from '@/features/settings/appearance'
import { statusBarStyle } from '@/ui/status-bar-style'
import { useColors } from '@/ui/theme'
import { resolveFontFamily } from '@/ui/typography'

configureReminderNotifications()
applyThemePreference(loadThemePreference())

// Root layout. Screen chrome pulls colour and type from @revv/tokens — no raw literals.
// The splash is held until Albert Sans (400/500/600/700) and JetBrains Mono (400) are
// in memory so the app never paints a fallback-font frame (docs/design-system.md §Typography).
void SplashScreen.preventAutoHideAsync()

// Routes reachable with no session — includes onboarding (pre-auth by definition;
// without this the redirect effect below would bounce an unauthenticated,
// never-onboarded user straight out of the onboarding carousel and into sign-in).
const AUTH_ROUTES = new Set(['sign-in', 'sign-up', 'verify-email', 'onboarding'])

/**
 * Redirects between the auth routes and the app depending on the session (ADR 0003).
 * A warm start has the session cached in SecureStore so `status` resolves without a
 * spinner.
 */
function AuthGate() {
  const color = useColors()
  const scheme = useColorScheme()
  const { status } = useSession()
  const segments = useSegments()
  const router = useRouter()

  usePushRegistration(status === 'authenticated')

  useEffect(() => {
    if (status === 'loading') return
    const onAuthRoute = AUTH_ROUTES.has(segments[0] ?? '')
    if (status === 'unauthenticated' && !onAuthRoute) {
      router.replace('/sign-in')
    } else if (status === 'authenticated' && onAuthRoute) {
      router.replace('/home')
    }
  }, [status, segments, router])

  return (
    <>
      <StatusBar style={statusBarStyle(segments, scheme === 'dark')} />
      <Stack
      screenOptions={{
        headerStyle: { backgroundColor: color.blue },
        headerTintColor: color.white,
        headerTitleStyle: {
          fontSize: text.title.fontSize,
          fontFamily: resolveFontFamily('ui', text.title.weight),
        },
        contentStyle: { backgroundColor: color.canvas },
        animation: 'slide_from_right',
        animationDuration: 320,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/[step]" options={{ headerShown: false }} />
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="sign-up" options={{ title: 'Create your account' }} />
      <Stack.Screen name="verify-email" options={{ title: 'Verify your email' }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="vehicle/new"
        options={{ title: 'Add a vehicle', presentation: 'modal' }}
      />
      <Stack.Screen name="vehicle/[id]" options={{ title: '' }} />
      <Stack.Screen name="dev-health" options={{ title: 'Api status' }} />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  const color = useColors()
  const [fontsLoaded, fontError] = useFonts({
    AlbertSans_400Regular,
    AlbertSans_500Medium,
    AlbertSans_600SemiBold,
    AlbertSans_700Bold,
    JetBrainsMono_400Regular,
  })

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: color.canvas }} />
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <SafeAreaProvider>
          <AuthGate />
        </SafeAreaProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  )
}
