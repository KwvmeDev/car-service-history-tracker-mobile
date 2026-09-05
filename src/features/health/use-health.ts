import { useCallback, useEffect, useState } from 'react'

import { api } from '@/api/generated/client'

export type HealthState =
  | { phase: 'loading' }
  | { phase: 'error'; message: string; retry: () => void }
  | { phase: 'degraded'; status: string; version: string; time: string; retry: () => void }
  | { phase: 'loaded'; status: string; version: string; time: string }

/**
 * Sprint 0's one data hook. Deliberately minimal — TanStack Query lands in Phase 1
 * (engineering-standards.md §Frontend). Every screen state is represented so the UI
 * can render all four deliberately.
 */
export function useHealth(): HealthState {
  const [state, setState] = useState<HealthState>({ phase: 'loading' })

  const load = useCallback(() => {
    setState({ phase: 'loading' })
    void api
      .GET('/v1/health')
      .then(({ data, error }) => {
        if (error !== undefined || data === undefined) {
          setState({ phase: 'error', message: 'The api could not be reached.', retry: load })
          return
        }
        const view = { status: data.status, version: data.version, time: data.time }
        setState(
          data.status === 'ok'
            ? { phase: 'loaded', ...view }
            : { phase: 'degraded', ...view, retry: load },
        )
      })
      .catch(() => {
        setState({ phase: 'error', message: 'The api could not be reached.', retry: load })
      })
  }, [])

  useEffect(load, [load])

  return state
}
