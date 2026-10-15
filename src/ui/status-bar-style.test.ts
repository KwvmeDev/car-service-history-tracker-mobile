import { statusBarStyle } from './status-bar-style'

describe('statusBarStyle', () => {
  it('uses dark icons on a white canvas in light mode', () => {
    expect(statusBarStyle(['(tabs)', 'settings'], false)).toBe('dark')
    expect(statusBarStyle(['(tabs)', 'vehicles'], false)).toBe('dark')
    expect(statusBarStyle(['sign-in'], false)).toBe('dark')
    expect(statusBarStyle(['onboarding', '[step]'], false)).toBe('dark')
  })

  it('uses light icons on a dark canvas in dark mode', () => {
    expect(statusBarStyle(['(tabs)', 'settings'], true)).toBe('light')
    expect(statusBarStyle(['sign-in'], true)).toBe('light')
  })

  it('always uses light icons over blue, in either theme', () => {
    for (const dark of [false, true]) {
      expect(statusBarStyle(['(tabs)', 'home'], dark)).toBe('light')
      expect(statusBarStyle(['vehicle', '[id]'], dark)).toBe('light')
      expect(statusBarStyle(['sign-up'], dark)).toBe('light')
    }
  })
})
