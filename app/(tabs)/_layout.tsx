import { Tabs } from 'expo-router'

import { TabBar } from '@/ui/TabBar'

/**
 * The post-auth shell: Home / Vehicles / Reminders / Settings behind a custom
 * floating pill bar (src/ui/TabBar.tsx — RN's default bar can't float). No native
 * headers here; each screen owns its own top content instead.
 */
export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="home"
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="vehicles" options={{ title: 'Vehicles' }} />
      <Tabs.Screen name="reminders" options={{ title: 'Reminders' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  )
}
