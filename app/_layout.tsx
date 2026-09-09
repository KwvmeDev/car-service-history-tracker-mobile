import { useEffect } from 'react'
import { View } from 'react-native'
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
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { color, text } from '@revv/tokens'

import { QueryProvider } from '@/data/QueryProvider'
import { useSession } from '@/features/auth/use-session'
import { usePushRegistration } from '@/features/notifications/use-push-registration'
import { configureReminderNotifications } from '@/features/reminders/notifications'
import { resolveFontFamily } from '@/ui/typography'

configureReminderNotifications()

// Root layout. Screen chrome pulls colour and type from @revv/tokens — no raw literals.
// The splash is held until Albert Sans (400/500/600/700) and JetBrains Mono (400) are
// in memory so the app never paints a fallback-font frame (docs/design-system.md §Typography).
void SplashScreen.preventAutoHideAsync()

const AUTH_ROUTES = new Set(['sign-in', 'sign-up', 'verify-email'])

/**
 * Redirects between the auth routes and the app depending on the session (ADR 0003).
 * A warm start has the session cached in SecureStore so `status` resolves without a
 * spinner.
 */
function AuthGate() {
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
      router.replace('/garage')
    }
  }, [status, segments, router])

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: color.navy },
        headerTintColor: color.white,
        headerTitleStyle: {
          fontSize: text.title.fontSize,
          fontFamily: resolveFontFamily('ui', text.title.weight),
        },
        contentStyle: { backgroundColor: color.white },
        animation: 'slide_from_right',
        animationDuration: 320,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="sign-up" options={{ title: 'Create your account' }} />
      <Stack.Screen name="verify-email" options={{ title: 'Verify your email' }} />
      <Stack.Screen name="garage" options={{ title: 'Garage' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen
        name="vehicle/new"
        options={{ title: 'Add a vehicle', presentation: 'modal' }}
      />
      <Stack.Screen name="vehicle/[id]" options={{ title: '' }} />
      <Stack.Screen name="dev-health" options={{ title: 'Api status' }} />
    </Stack>
  )
}

export default function RootLayout() {
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
    return <View style={{ flex: 1, backgroundColor: color.white }} />
  }

  return (
    <QueryProvider>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AuthGate />
      </SafeAreaProvider>
    </QueryProvider>
  )
}
