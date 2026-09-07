import { text } from '@revv/tokens'

import { resolveFontFamily, TEXT_TOKENS, textStyle } from './typography'

describe('textStyle', () => {
  it('maps every text token to a style with the token size and line height', () => {
    for (const token of TEXT_TOKENS) {
      const style = textStyle(token)

      expect(style.fontSize).toBe(text[token].fontSize)
      expect(style.lineHeight).toBe(text[token].lineHeight)
      expect(style.fontFamily.length).toBeGreaterThan(0)
    }
  })

  it('never emits a font weight other than 400 or 500', () => {
    const weights = new Set<number>()

    for (const token of TEXT_TOKENS) {
      weights.add(textStyle(token).fontWeight)
      weights.add(textStyle(token, { weight: 'regular' }).fontWeight)
      weights.add(textStyle(token, { weight: 'medium' }).fontWeight)
    }

    expect([...weights].sort()).toEqual([400, 500])
  })

  it('renders the mono token in the JetBrains Mono family', () => {
    expect(textStyle('mono').fontFamily).toBe('JetBrainsMono_400Regular')
  })

  it('renders a UI token in the Inter family, medium at the 500 face', () => {
    expect(textStyle('body').fontFamily).toBe('Inter_400Regular')
    expect(textStyle('title', { weight: 'medium' }).fontFamily).toBe('Inter_500Medium')
  })

  it('forces the data family when data:true even for a non-mono token', () => {
    expect(textStyle('label', { data: true }).fontFamily).toBe('JetBrainsMono_400Regular')
  })

  it('keeps data text on the 400 face even at medium weight (JetBrains Mono ships 400 only)', () => {
    const style = textStyle('mono', { weight: 'medium' })

    expect(style.fontFamily).toBe('JetBrainsMono_400Regular')
    expect(style.fontWeight).toBe(500)
  })
})

describe('resolveFontFamily', () => {
  it('resolves font.ui to Inter and font.data to JetBrains Mono', () => {
    expect(resolveFontFamily('ui')).toBe('Inter_400Regular')
    expect(resolveFontFamily('ui', 500)).toBe('Inter_500Medium')
    expect(resolveFontFamily('data')).toBe('JetBrainsMono_400Regular')
  })
})
