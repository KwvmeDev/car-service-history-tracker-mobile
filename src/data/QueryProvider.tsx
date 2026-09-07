import { useEffect, useRef, type ReactNode } from 'react'
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

const isOnline = (state: Network.NetworkState): boolean =>
  Boolean(state.isConnected) && state.isInternetReachable !== false

// onlineManager decides whether mutations run or pause and resume on reconnect
// (ADR 0004). expo-network is the connectivity source of truth. Registered once at
// module load; the listener only fires on change, so QueryProvider seeds the initial
// value on mount.
onlineManager.setEventListener((setOnline) => {
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
