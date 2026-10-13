import { useEffect, useRef } from 'react'
import { Animated, Pressable, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { color, radius, shadow, space } from '@revv/tokens'

import { useReducedMotion } from './motion'

type IconName = React.ComponentProps<typeof Ionicons>['name']

const ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  home: { active: 'home', inactive: 'home-outline' },
  vehicles: { active: 'list', inactive: 'list-outline' },
  reminders: { active: 'notifications', inactive: 'notifications-outline' },
  settings: { active: 'settings', inactive: 'settings-outline' },
}

const ICON_SIZE = 22
const SLOT_WIDTH = 64
// +2px total height, -6px total width vs the space.sm/space.md tokens — a
// deliberate one-off tune, not a reusable spacing step.
const EDGE_PADDING = space.sm - 3
const BAR_PADDING_V = space.md + 1
const INDICATOR_SIZE = 48
const INDICATOR_LEFT = EDGE_PADDING + (SLOT_WIDTH - INDICATOR_SIZE) / 2
const INDICATOR_TOP = (BAR_PADDING_V * 2 + ICON_SIZE - INDICATOR_SIZE) / 2

/**
 * The floating pill tab bar — 4 icon-only tabs, the active one circled in white.
 * Custom render via Tabs' `tabBar` prop (RN's default bar can't float or go
 * pill-shaped). One white indicator slides between fixed-width slots rather than
 * 4 buttons independently swapping colour, so it reads as one thing moving
 * (design-with-taste §Fluidity — unified interpolation). The slide is a
 * critically-damped spring (apple-design §4's "move/reposition" preset), with a
 * reduced-motion fallback that snaps instead of animating.
 */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const reducedMotion = useReducedMotion()
  const indicator = useRef(new Animated.Value(state.index * SLOT_WIDTH)).current

  useEffect(() => {
    const target = state.index * SLOT_WIDTH
    if (reducedMotion) {
      indicator.setValue(target)
      return
    }
    Animated.spring(indicator, {
      toValue: target,
      useNativeDriver: true,
      damping: 20,
      mass: 0.6,
      stiffness: 220,
    }).start()
  }, [state.index, reducedMotion, indicator])

  return (
    <View
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, space.md) }]}
      pointerEvents="box-none"
    >
      <View style={styles.bar}>
        <Animated.View
          style={[styles.indicator, { transform: [{ translateX: indicator }] }]}
        />
        {state.routes.map((route, index) => {
          const focused = state.index === index
          const icons = ICONS[route.name] ?? ICONS.home
          const name = focused ? icons?.active : icons?.inactive
          const title = descriptors[route.key]?.options.title

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={typeof title === 'string' ? title : route.name}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                })
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name)
                }
              }}
              style={styles.slot}
              hitSlop={8}
            >
              {name ? (
                <Ionicons name={name} size={ICON_SIZE} color={focused ? color.blue : color.blueSubtle} />
              ) : null}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  bar: {
    flexDirection: 'row',
    backgroundColor: color.blue,
    borderRadius: radius.full,
    paddingHorizontal: EDGE_PADDING,
    paddingVertical: BAR_PADDING_V,
    ...shadow.lg.native,
  },
  slot: { width: SLOT_WIDTH, alignItems: 'center', justifyContent: 'space-evenly' },
  indicator: {
    position: 'absolute',
    left: INDICATOR_LEFT,
    top: INDICATOR_TOP,
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: radius.full,
    backgroundColor: color.white,
    ...shadow.sm.native,
  },
})
