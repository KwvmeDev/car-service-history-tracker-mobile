import { MMKV } from 'react-native-mmkv'

import type { GarageSort } from './api'

/**
 * Persists the garage sort choice on the device (Sprint 8). It is a UI convenience,
 * not user data, so MMKV is the right store (not SecureStore, not the server).
 */

const KEY = 'garage.sort'
const VALID: readonly GarageSort[] = ['recent', 'nickname', 'mileage']

export interface KeyValueStore {
  set(key: string, value: string): void
  getString(key: string): string | undefined
}

let shared: KeyValueStore | undefined
function store(): KeyValueStore {
  shared ??= new MMKV({ id: 'revv-garage' })
  return shared
}

export function loadGarageSort(kv: KeyValueStore = store()): GarageSort {
  const raw = kv.getString(KEY)
  return VALID.includes(raw as GarageSort) ? (raw as GarageSort) : 'recent'
}

export function saveGarageSort(sort: GarageSort, kv: KeyValueStore = store()): void {
  kv.set(KEY, sort)
}
