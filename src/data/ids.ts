import { v7 as uuidv7 } from 'uuid'

/**
 * Client-minted primary key for a syncable row (ADR 0004).
 *
 * The client owns the id so an offline-created record has permanent identity from
 * birth — the optimistic cache entry and the server row are the same id, no
 * reconciliation. UUID v7 is time-ordered, so lists stay roughly insertion-sorted.
 */
export function newId(): string {
  return uuidv7()
}
