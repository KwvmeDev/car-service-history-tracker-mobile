import { useCallback, useEffect, useState } from 'react'

import { api } from '@/api/client'

import { toHealthSnapshot, type HealthSnapshot } from './health-snapshot'

export type { HealthSnapshot } from './health-snapshot'
export type HealthState = HealthSnapshot & { retry: () => void }

/** Sprint 0's one data hook. TanStack Query lands in Phase 1 (engineering-standards.md). */
export function useHealth(): HealthState {
  const [snapshot, setSnapshot] = useState<HealthSnapshot>({ phase: 'loading' })

  const load = useCallback(() => {
    setSnapshot({ phase: 'loading' })
    void api
      .GET('/v1/health')
      .then((result) => {
        setSnapshot(toHealthSnapshot(result))
      })
      .catch(() => {
        setSnapshot({ phase: 'error', message: 'The api could not be reached.' })
      })
  }, [])

  useEffect(load, [load])

  return { ...snapshot, retry: load }
}
