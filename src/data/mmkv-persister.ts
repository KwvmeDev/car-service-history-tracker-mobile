import { MMKV } from 'react-native-mmkv'
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client'

/**
 * A synchronous TanStack Query persister backed by react-native-mmkv (ADR 0004 —
 * reads are cached to disk so opening the app offline shows the last-known garage).
 *
 * MMKV is synchronous JSI storage, so persist/restore never block on a promise; the
 * Persister contract still permits sync returns.
 */

/** The slice of MMKV this module needs — lets a test pass an in-memory double. */
export interface KeyValueStore {
  set(key: string, value: string): void
  getString(key: string): string | undefined
  delete(key: string): void
}

export interface MmkvPersisterOptions {
  storage?: KeyValueStore
  /** Storage key for the serialized cache. */
  cacheKey?: string
}

const DEFAULT_KEY = 'revv.reactQuery'

let sharedStore: KeyValueStore | undefined

function defaultStore(): KeyValueStore {
  sharedStore ??= new MMKV({ id: 'revv-query-cache' })
  return sharedStore
}

export function createMmkvPersister(options: MmkvPersisterOptions = {}): Persister {
  const storage = options.storage ?? defaultStore()
  const cacheKey = options.cacheKey ?? DEFAULT_KEY

  return {
    persistClient: (client: PersistedClient) => {
      storage.set(cacheKey, JSON.stringify(client))
    },
    restoreClient: () => {
      const raw = storage.getString(cacheKey)
      if (raw === undefined) {
        return undefined
      }
      return JSON.parse(raw) as PersistedClient
    },
    removeClient: () => {
      storage.delete(cacheKey)
    },
  }
}
