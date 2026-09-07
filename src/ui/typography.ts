import { fontWeight, text, type FontToken, type TextToken } from '@revv/tokens'

/**
 * Resolves a @revv/tokens text token to a concrete React Native text style.
 *
 * `font.ui` -> the loaded Inter family, `font.data` -> the loaded JetBrains Mono
 * family (both loaded in app/_layout.tsx via expo-font). Two weights only, ever: 400
 * and 500 (docs/design-system.md §Typography — hierarchy comes from size, colour and
 * space, not weight). JetBrains Mono ships at 400 only, so a `medium` request on data
 * text still renders the 400 face.
 */

/** expo-font family keys — the identifiers @expo-google-fonts/* register under. */
const LOADED_FAMILY: Record<FontToken, { readonly 400: string; readonly 500: string }> = {
  ui: { 400: 'Inter_400Regular', 500: 'Inter_500Medium' },
  data: { 400: 'JetBrainsMono_400Regular', 500: 'JetBrainsMono_400Regular' },
}

export type TextWeightName = keyof typeof fontWeight // 'regular' | 'medium'

export interface ResolvedTextStyle {
  readonly fontFamily: string
  readonly fontSize: number
  readonly lineHeight: number
  readonly fontWeight: 400 | 500
}

export interface TextStyleOptions {
  /** 'regular' (400, default) or 'medium' (500). Nothing else exists. */
  readonly weight?: TextWeightName
  /** Force the monospace data family regardless of the token. */
  readonly data?: boolean
}

/** The loaded family name for a font token (`font.ui` / `font.data`) at a given weight. */
export function resolveFontFamily(which: FontToken, weight: 400 | 500 = 400): string {
  return LOADED_FAMILY[which][weight]
}

/**
 * @param token one of display | title | body | label | mono | caption
 */
export function textStyle(token: TextToken, options: TextStyleOptions = {}): ResolvedTextStyle {
  const scale = text[token]
  const weightValue = fontWeight[options.weight ?? 'regular']
  const which: FontToken = (options.data ?? token === 'mono') ? 'data' : 'ui'

  return {
    fontFamily: resolveFontFamily(which, weightValue),
    fontSize: scale.fontSize,
    lineHeight: scale.lineHeight,
    fontWeight: weightValue,
  }
}

/** Every text token, for exhaustive iteration in tests and pickers. */
export const TEXT_TOKENS: readonly TextToken[] = [
  'display',
  'title',
  'body',
  'label',
  'mono',
  'caption',
]
