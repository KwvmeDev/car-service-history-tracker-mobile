import { useEffect } from 'react'
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter'
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono'
import { useFonts } from 'expo-font'
import { SplashScreen, Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { color, text } from '@revv/tokens'

import { QueryProvider } from '@/data/QueryProvider'

// Root layout. Screen chrome pulls colour and type from @revv/tokens — no raw
// literals anywhere in this repo.
//
// The splash is held until Inter (400/500) and JetBrains Mono (400) are in memory so
// the app never paints a fallback-font frame (docs/design-system.md §Typography).
void SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    JetBrainsMono_400Regular,
  })

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) {
    return null
  }

  return (
    <QueryProvider>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: color.navy },
            headerTintColor: color.white,
            headerTitleStyle: { fontSize: text.title.fontSize },
            contentStyle: { backgroundColor: color.white },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Api status' }} />
        </Stack>
      </SafeAreaProvider>
    </QueryProvider>
  )
}
