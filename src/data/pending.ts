/**
 * The "pending sync" marker (ADR 0004).
 *
 * When a write applies optimistically the cached row is tagged so the UI can show it
 * as "not synced yet". The tag is a non-enumerable-ish extra field the API never
 * sends; it is stripped before anything cares about equality with the server row.
 */

export const PENDING_KEY = '__pendingSync' as const

export type WithPending<T> = T & { readonly [PENDING_KEY]?: boolean }

export function markPending<T>(row: T): WithPending<T> {
  return { ...row, [PENDING_KEY]: true }
}

export function clearPending<T>(row: WithPending<T>): T {
  const { [PENDING_KEY]: _pending, ...rest } = row
  return rest as T
}

export function isPending<T>(row: WithPending<T> | undefined | null): boolean {
  return row?.[PENDING_KEY] === true
}
