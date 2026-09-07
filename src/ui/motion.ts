import { Easing } from 'react-native'
import { dur, ease } from '@revv/tokens'

/**
 * @revv/tokens motion values, resolved for React Native's `Animated` API
 * (docs/design-system.md §Motion). The tokens are authored as CSS `cubic-bezier`
 * strings — this is the one place they are parsed into `Easing.bezier(...)`.
 *
 * Screen-transition presets for expo-router's Stack live in `screen-transitions.ts`;
 * this module is the primitive layer that both it and the components build on.
 */

function bezierFromToken(token: string): (value: number) => number {
  const match = /cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/.exec(
    token,
  )
  if (!match) {
    return Easing.inOut(Easing.ease)
  }
  const [x1, y1, x2, y2] = [
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    Number(match[4]),
  ]
  return Easing.bezier(x1, y1, x2, y2)
}

/** Entrances and morphs. Fast start, gentle settle. */
export const easeEnter = bezierFromToken(ease.enter)
/** Exits only. */
export const easeExit = bezierFromToken(ease.exit)
/** Press / hover feedback. */
export const easeMicro = bezierFromToken(ease.micro)

export const durMicro = dur.micro
export const durEnter = dur.enter
export const durMorph = dur.morph

/** Standard entrance timing config for `Animated.timing`. */
export const enterTiming = { duration: durEnter, easing: easeEnter, useNativeDriver: true } as const
export const exitTiming = { duration: 220, easing: easeExit, useNativeDriver: true } as const
export const microTiming = { duration: durMicro, easing: easeMicro, useNativeDriver: true } as const
