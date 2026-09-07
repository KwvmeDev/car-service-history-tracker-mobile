import { QueryClient } from '@tanstack/react-query'

// Offline reads must survive a cold start (ADR 0004): the cache is garbage-collected
// only after a week, and stays "fresh enough" for five minutes so returning to a
// screen does not trigger a refetch storm.
const FIVE_MINUTES = 1000 * 60 * 5
const ONE_WEEK = 1000 * 60 * 60 * 24 * 7
const MAX_BACKOFF = 1000 * 30

/** HTTP statuses where retrying cannot help — the request itself is the problem. */
const NON_RETRYABLE = new Set([400, 401, 403, 404, 409, 422])

interface MaybeStatus {
  status?: unknown
}

function statusOf(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const value = (error as MaybeStatus).status
    return typeof value === 'number' ? value : undefined
  }
  return undefined
}

const backoff = (attempt: number): number => Math.min(1000 * 2 ** attempt, MAX_BACKOFF)

export function shouldRetry(failureCount: number, error: unknown): boolean {
  const status = statusOf(error)
  if (status !== undefined && NON_RETRYABLE.has(status)) {
    return false
  }
  return failureCount < 3
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: FIVE_MINUTES,
        gcTime: ONE_WEEK,
        retry: shouldRetry,
        retryDelay: backoff,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        // The optimistic-mutation helper (subtask 08) owns rollback; a couple of
        // network retries with backoff cover a flaky connection.
        retry: 2,
        retryDelay: backoff,
      },
    },
  })
}
