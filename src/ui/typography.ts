import {
  fontWeight,
  text,
  type FontToken,
  type FontWeightName,
  type FontWeightValue,
  type TextToken,
} from '@revv/tokens'

/**
 * Resolves a @revv/tokens text token to a concrete React Native text style.
 *
 * `font.ui` -> the loaded Albert Sans family, `font.data` -> the loaded JetBrains Mono
 * family (loaded in app/_layout.tsx via expo-font). Hierarchy is weight-first
 * (docs/open-design.ai-DESIGN.md §3): each text token has a default weight; pass
 * `weight` only to override it. JetBrains Mono ships at 400 only, so any weight on
 * data text renders the 400 face.
 */

/** expo-font family keys — the identifiers @expo-google-fonts/* register under. */
const UI_FAMILY: Record<FontWeightValue, string> = {
  400: 'AlbertSans_400Regular',
  500: 'AlbertSans_500Medium',
  600: 'AlbertSans_600SemiBold',
  700: 'AlbertSans_700Bold',
}

const DATA_FAMILY = 'JetBrainsMono_400Regular'

export type TextWeightName = FontWeightName

export interface ResolvedTextStyle {
  readonly fontFamily: string
  readonly fontSize: number
  readonly lineHeight: number
  readonly fontWeight: FontWeightValue
}

export interface TextStyleOptions {
  /** Override the token's default weight: regular | medium | semibold | bold. */
  readonly weight?: TextWeightName
  /** Force the monospace data family regardless of the token. */
  readonly data?: boolean
}

/** The loaded family name for a font token (`font.ui` / `font.data`) at a given weight. */
export function resolveFontFamily(which: FontToken, weight: FontWeightValue = 400): string {
  return which === 'data' ? DATA_FAMILY : UI_FAMILY[weight]
}

/**
 * @param token one of display | title | heading | body | label | mono | caption
 */
export function textStyle(token: TextToken, options: TextStyleOptions = {}): ResolvedTextStyle {
  const scale = text[token]
  const weightValue: FontWeightValue = options.weight
    ? fontWeight[options.weight]
    : scale.weight
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
  'heading',
  'body',
  'label',
  'mono',
  'caption',
]
