/**
 * openapi-fetch returns `{ data, error }`; TanStack Query wants a thrown error whose
 * shape the retry policy (src/data/query-client.ts) can read (`.status`). This turns
 * an api-client result into a value or a thrown `ApiError`.
 */

interface ErrorEnvelope {
  error?: {
    code?: string
    message?: string
    details?: { path: string; message: string }[]
  }
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: { path: string; message: string }[]

  constructor(status: number, body: unknown) {
    const envelope = (body ?? {}) as ErrorEnvelope
    super(envelope.error?.message ?? `Request failed (${String(status)})`)
    this.name = 'ApiError'
    this.status = status
    this.code = envelope.error?.code ?? 'UNKNOWN'
    this.details = envelope.error?.details ?? []
  }
}

/** Network failure / timeout — no HTTP response at all. Retryable. */
export class NetworkError extends Error {
  readonly status = undefined
  constructor() {
    super("We couldn't reach the server.")
    this.name = 'NetworkError'
  }
}

export interface ClientResult<T> {
  data?: T
  error?: unknown
  response?: Response
}

/** Unwrap an openapi-fetch result: return `data`, or throw `ApiError` / `NetworkError`. */
export function unwrap<T>(result: ClientResult<T>): T {
  if (result.data !== undefined && result.error === undefined) {
    return result.data
  }
  const status = result.response?.status
  if (status === undefined) {
    throw new NetworkError()
  }
  throw new ApiError(status, result.error)
}
