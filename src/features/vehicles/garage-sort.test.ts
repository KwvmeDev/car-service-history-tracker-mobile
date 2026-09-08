import type { KeyValueStore } from './garage-sort'
import { loadGarageSort, saveGarageSort } from './garage-sort'

function memStore(): KeyValueStore {
  const map = new Map<string, string>()
  return {
    set: (k, v) => map.set(k, v),
    getString: (k) => map.get(k),
  }
}

describe('garage-sort persistence', () => {
  it('defaults to recent when nothing is stored', () => {
    expect(loadGarageSort(memStore())).toBe('recent')
  })

  it('round-trips a saved choice', () => {
    const kv = memStore()
    saveGarageSort('mileage', kv)
    expect(loadGarageSort(kv)).toBe('mileage')
  })

  it('falls back to recent for a corrupt value', () => {
    const kv = memStore()
    kv.set('garage.sort', 'nonsense')
    expect(loadGarageSort(kv)).toBe('recent')
  })
})
