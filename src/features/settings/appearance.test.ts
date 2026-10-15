import { Appearance } from 'react-native'

import {
  applyThemePreference,
  loadThemePreference,
  saveThemePreference,
  type KeyValueStore,
} from './appearance'

function memStore(): KeyValueStore {
  const map = new Map<string, string>()
  return {
    set: (k, v) => map.set(k, v),
    getString: (k) => map.get(k),
  }
}

describe('appearance preference', () => {
  let setScheme: jest.SpyInstance

  beforeEach(() => {
    setScheme = jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => undefined)
  })

  afterEach(() => {
    setScheme.mockRestore()
  })

  it('defaults to system when nothing is stored', () => {
    expect(loadThemePreference(memStore())).toBe('system')
  })

  it('round-trips a saved choice', () => {
    const kv = memStore()
    saveThemePreference('dark', kv)
    expect(loadThemePreference(kv)).toBe('dark')
  })

  it('falls back to system for a corrupt value', () => {
    const kv = memStore()
    kv.set('appearance.theme', 'sepia')
    expect(loadThemePreference(kv)).toBe('system')
  })

  it('pins the OS scheme for light and dark, and releases it for system', () => {
    applyThemePreference('dark')
    expect(setScheme).toHaveBeenLastCalledWith('dark')
    applyThemePreference('light')
    expect(setScheme).toHaveBeenLastCalledWith('light')
    applyThemePreference('system')
    expect(setScheme).toHaveBeenLastCalledWith('unspecified')
  })

  it('saving applies the choice immediately', () => {
    saveThemePreference('dark', memStore())
    expect(setScheme).toHaveBeenCalledWith('dark')
  })
})
