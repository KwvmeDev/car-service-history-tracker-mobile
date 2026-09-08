import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native'
import { color, type TextToken } from '@revv/tokens'

import { textStyle, type TextWeightName } from './typography'

type ToneName = 'primary' | 'secondary' | 'onNavy' | 'onNavySubtle' | 'attention'

const TONE: Record<ToneName, string> = {
  primary: color.ink,
  secondary: color.ink,
  onNavy: color.white,
  onNavySubtle: color.navySubtle,
  attention: color.amber,
}

export interface AppTextProps extends RNTextProps {
  /** A @revv/tokens type token — display | title | heading | body | label | mono | caption. */
  token?: TextToken
  /** Override the token's default weight: regular | medium | semibold | bold. */
  weight?: TextWeightName
  /** Force the monospace data family (VIN, odometer, dates, costs). */
  data?: boolean
  /** Colour role. Defaults to primary ink. */
  tone?: ToneName
}

/**
 * The only text component in the app. Every string on screen goes through it so type
 * and colour always come from @revv/tokens and never from a raw literal
 * (engineering-standards.md §Frontend, check-design-tokens.mjs).
 */
export function AppText({
  token = 'body',
  weight,
  data,
  tone = 'primary',
  style,
  ...rest
}: AppTextProps) {
  const resolved = textStyle(token, { weight, data })
  const base: TextStyle = {
    fontFamily: resolved.fontFamily,
    fontSize: resolved.fontSize,
    lineHeight: resolved.lineHeight,
    color: tone === 'secondary' ? color.ink : TONE[tone],
    opacity: tone === 'secondary' ? 0.6 : 1,
  }
  return <RNText style={[base, style]} {...rest} />
}
