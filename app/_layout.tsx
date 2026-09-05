import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { color, text } from '@revv/tokens'

// Root layout. One stack, no navigation surface yet (Sprint 0). Screen chrome pulls
// colour and type from @revv/tokens — no raw literals anywhere in this repo.
export default function RootLayout() {
  return (
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
  )
}
