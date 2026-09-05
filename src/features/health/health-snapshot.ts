export type HealthSnapshot =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'degraded'; status: string; version: string; time: string }
  | { phase: 'loaded'; status: string; version: string; time: string }

interface ClientResult {
  data?: { status?: string; version?: string; time?: string } | undefined
  error?: unknown
}

/**
 * Pure mapping from an api-client result to a screen state. No React, no Expo — tested
 * directly; `useHealth` is just the wiring around it (testing-strategy.md).
 */
export function toHealthSnapshot(result: ClientResult): HealthSnapshot {
  const { data, error } = result
  if (error !== undefined || !data?.status || !data.version || !data.time) {
    return { phase: 'error', message: 'The api could not be reached.' }
  }
  const view = { status: data.status, version: data.version, time: data.time }
  return data.status === 'ok' ? { phase: 'loaded', ...view } : { phase: 'degraded', ...view }
}
