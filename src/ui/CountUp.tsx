import { useEffect, useRef, useState } from 'react'
import { Animated, Easing } from 'react-native'

import { AppText, type AppTextProps } from './Text'

export interface CountUpProps extends Omit<AppTextProps, 'children'> {
  /** The target number. Animates from the previous value on change. */
  value: number
  /** Optional formatter — defaults to a grouped integer (commas). */
  format?: (n: number) => string
  durationMs?: number
}

const groupInt = (n: number): string => Math.round(n).toLocaleString('en-US')

/**
 * design-system.md §Motion — "numbers animate; commas shift, never swap". Odometer
 * readings, total spend and counts count up to their new value. Data font by default.
 */
export function CountUp({ value, format = groupInt, durationMs = 600, ...textProps }: CountUpProps) {
  const anim = useRef(new Animated.Value(value)).current
  const [display, setDisplay] = useState(() => format(value))

  useEffect(() => {
    const id = anim.addListener(({ value: v }) => {
      setDisplay(format(v))
    })
    Animated.timing(anim, {
      toValue: value,
      duration: durationMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
    return () => {
      anim.removeListener(id)
    }
  }, [value, anim, durationMs, format])

  return (
    <AppText token="mono" {...textProps}>
      {display}
    </AppText>
  )
}
