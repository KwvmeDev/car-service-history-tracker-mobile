// Jest setup for revv-mobile (jest-expo). Registers the native-module mocks every test
// needs so no test has to remember to. See docs/testing-strategy.md.
//
// - react-native-reanimated: the library's own mock (no UI thread in the test runtime).
// - react-native-mmkv: an in-memory MMKV whose surface matches the real class, so the
//   query persister (subtask 07) can dehydrate/rehydrate against it.
// - expo-secure-store: an in-memory keychain so the auth surface (subtask 09) is testable
//   without a device. The session token must touch THIS and nothing else.
//
// jest.mock factories are hoisted above imports and may not reference out-of-scope names
// (including local `type` aliases), so the mocks below stay deliberately literal.

/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-require-imports */

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'))

jest.mock('react-native-mmkv', () => {
  class MMKV {
    private readonly store = new Map<string, string | number | boolean | Uint8Array>()

    getString(key: string): string | undefined {
      const value = this.store.get(key)
      return typeof value === 'string' ? value : undefined
    }

    getNumber(key: string): number | undefined {
      const value = this.store.get(key)
      return typeof value === 'number' ? value : undefined
    }

    getBoolean(key: string): boolean | undefined {
      const value = this.store.get(key)
      return typeof value === 'boolean' ? value : undefined
    }

    set(key: string, value: string | number | boolean | Uint8Array): void {
      this.store.set(key, value)
    }

    delete(key: string): void {
      this.store.delete(key)
    }

    contains(key: string): boolean {
      return this.store.has(key)
    }

    getAllKeys(): string[] {
      return [...this.store.keys()]
    }

    clearAll(): void {
      this.store.clear()
    }
  }

  return { MMKV, Mode: { SINGLE_PROCESS: 0, MULTI_PROCESS: 1 } }
})

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>()
  return {
    WHEN_UNLOCKED: 'whenUnlocked',
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'whenUnlockedThisDeviceOnly',
    setItemAsync: jest.fn((key: string, value: string): Promise<void> => {
      store.set(key, value)
      return Promise.resolve()
    }),
    getItemAsync: jest.fn((key: string): Promise<string | null> => {
      return Promise.resolve(store.get(key) ?? null)
    }),
    deleteItemAsync: jest.fn((key: string): Promise<void> => {
      store.delete(key)
      return Promise.resolve()
    }),
    isAvailableAsync: jest.fn((): Promise<boolean> => Promise.resolve(true)),
    __store: store,
  }
})
