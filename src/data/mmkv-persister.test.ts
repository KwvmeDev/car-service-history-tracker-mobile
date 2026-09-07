import { QueryClient } from '@tanstack/react-query'
import {
  persistQueryClientRestore,
  persistQueryClientSave,
} from '@tanstack/react-query-persist-client'

import { createMmkvPersister, type KeyValueStore } from './mmkv-persister'

// gcTime Infinity => no garbage-collection timer left running after the test.
const newClient = (): QueryClient =>
  new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } })

function inMemoryStore(): KeyValueStore {
  const map = new Map<string, string>()
  return {
    set: (key, value) => map.set(key, value),
    getString: (key) => map.get(key),
    delete: (key) => {
      map.delete(key)
    },
  }
}

describe('createMmkvPersister', () => {
  it('round-trips query data: persist from one client, restore into a fresh one', async () => {
    const persister = createMmkvPersister({ storage: inMemoryStore() })
    const vehicles = [{ id: 'v1', nickname: 'The wagon' }]

    const source = newClient()
    source.setQueryData(['vehicles'], vehicles)
    await persistQueryClientSave({ queryClient: source, persister })

    const restored = newClient()
    await persistQueryClientRestore({ queryClient: restored, persister })

    expect(restored.getQueryData(['vehicles'])).toEqual(vehicles)
  })

  it('restores nothing when the persisted cache is under a different buster', async () => {
    const storage = inMemoryStore()
    const source = newClient()
    source.setQueryData(['vehicles'], [{ id: 'v1' }])
    await persistQueryClientSave({
      queryClient: source,
      persister: createMmkvPersister({ storage }),
      buster: 'old',
    })

    const restored = newClient()
    await persistQueryClientRestore({
      queryClient: restored,
      persister: createMmkvPersister({ storage }),
      buster: 'new',
    })

    expect(restored.getQueryData(['vehicles'])).toBeUndefined()
  })

  it('removeClient clears the persisted cache', async () => {
    const storage = inMemoryStore()
    const persister = createMmkvPersister({ storage })
    const source = newClient()
    source.setQueryData(['x'], 1)
    await persistQueryClientSave({ queryClient: source, persister })

    await persister.removeClient()

    const restored = newClient()
    await persistQueryClientRestore({ queryClient: restored, persister })
    expect(restored.getQueryData(['x'])).toBeUndefined()
  })

  it('defaults to the mocked react-native-mmkv store when no storage is injected', async () => {
    const persister = createMmkvPersister()
    const source = newClient()
    source.setQueryData(['health'], { status: 'ok' })

    await persistQueryClientSave({ queryClient: source, persister })
    const restored = newClient()
    await persistQueryClientRestore({ queryClient: restored, persister })

    expect(restored.getQueryData(['health'])).toEqual({ status: 'ok' })
  })
})
