import { useEffect, useRef, type ReactNode } from 'react'
import { Platform } from 'react-native'
import Constants from 'expo-constants'
import * as Network from 'expo-network'
import { onlineManager, type QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'

import { createMmkvPersister } from './mmkv-persister'
import { createQueryClient } from './query-client'

const ONE_WEEK = 1000 * 60 * 60 * 24 * 7

// Bump alongside `npm run client:generate` whenever the API contract or the shape of
// anything cached changes. A cache from an older buster is dropped on launch, never
// migrated (ADR 0004 — no sync engine in v1).
const QUERY_CACHE_SCHEMA = '1'
const APP_VERSION = Constants.expoConfig?.version ?? '0'
const CACHE_BUSTER = `${APP_VERSION}:${QUERY_CACHE_SCHEMA}`

// Optimistic (ADR 0004): treat "unknown" as online. On web expo-network reports
// `isConnected: undefined`; assuming offline there would pause every query forever.
const isOnline = (state: Network.NetworkState): boolean => {
  if (Platform.OS === 'web') return typeof navigator === 'undefined' ? true : navigator.onLine
  if (state.isConnected == null) return true
  return state.isConnected && state.isInternetReachable !== false
}

// onlineManager decides whether mutations run or pause and resume on reconnect
// (ADR 0004). On native, expo-network is the source of truth; on web (a preview
// target) the browser's online/offline events are, and expo-network's listener can
// fire spuriously. Registered once at module load.
onlineManager.setEventListener((setOnline) => {
  if (Platform.OS === 'web') {
    const onOnline = (): void => {
      setOnline(true)
    }
    const onOffline = (): void => {
      setOnline(false)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('online', onOnline)
      window.addEventListener('offline', onOffline)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', onOnline)
        window.removeEventListener('offline', onOffline)
      }
    }
  }
  const subscription = Network.addNetworkStateListener((state) => {
    setOnline(isOnline(state))
  })
  return () => {
    subscription.remove()
  }
})

export function QueryProvider({ children }: { children: ReactNode }) {
  const clientRef = useRef<QueryClient | null>(null)
  clientRef.current ??= createQueryClient()

  const persisterRef = useRef(createMmkvPersister())

  useEffect(() => {
    if (Platform.OS === 'web') {
      onlineManager.setOnline(typeof navigator === 'undefined' ? true : navigator.onLine)
      return
    }
    void Network.getNetworkStateAsync().then((state) => {
      onlineManager.setOnline(isOnline(state))
    })
  }, [])

  return (
    <PersistQueryClientProvider
      client={clientRef.current}
      persistOptions={{
        persister: persisterRef.current,
        buster: CACHE_BUSTER,
        maxAge: ONE_WEEK,
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}
