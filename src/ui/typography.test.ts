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

  it('uses each token default weight, and only ever emits a loadable Albert Sans weight', () => {
    const allowed = new Set([400, 500, 600, 700])

    for (const token of TEXT_TOKENS) {
      const style = textStyle(token)
      expect(style.fontWeight).toBe(text[token].weight)
      expect(allowed.has(style.fontWeight)).toBe(true)
    }
  })

  it('lets a caller override the token weight', () => {
    expect(textStyle('body', { weight: 'bold' }).fontWeight).toBe(700)
    expect(textStyle('display', { weight: 'regular' }).fontWeight).toBe(400)
  })

  it('renders the mono token in the JetBrains Mono family', () => {
    expect(textStyle('mono').fontFamily).toBe('JetBrainsMono_400Regular')
  })

  it('renders a UI token in the Albert Sans family at the right face', () => {
    expect(textStyle('body').fontFamily).toBe('AlbertSans_400Regular')
    expect(textStyle('title').fontFamily).toBe('AlbertSans_600SemiBold')
    expect(textStyle('title', { weight: 'medium' }).fontFamily).toBe('AlbertSans_500Medium')
  })

  it('forces the data family when data:true even for a non-mono token', () => {
    expect(textStyle('label', { data: true }).fontFamily).toBe('JetBrainsMono_400Regular')
  })

  it('keeps data text on the 400 face even at a heavier weight (JetBrains Mono ships 400 only)', () => {
    const style = textStyle('mono', { weight: 'bold' })

    expect(style.fontFamily).toBe('JetBrainsMono_400Regular')
    expect(style.fontWeight).toBe(700)
  })
})

describe('resolveFontFamily', () => {
  it('resolves font.ui to Albert Sans and font.data to JetBrains Mono', () => {
    expect(resolveFontFamily('ui')).toBe('AlbertSans_400Regular')
    expect(resolveFontFamily('ui', 600)).toBe('AlbertSans_600SemiBold')
    expect(resolveFontFamily('data')).toBe('JetBrainsMono_400Regular')
  })
})
