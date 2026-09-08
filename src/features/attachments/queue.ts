import { MMKV } from 'react-native-mmkv'
import * as FileSystem from 'expo-file-system/legacy'

import { newId } from '@/data/ids'

/**
 * The offline attachment hold (ADR 0004). A photo captured while offline is copied
 * into the app's document directory and a queue entry is persisted to MMKV, so it
 * survives an app kill. `drainQueue` uploads pending entries when connectivity
 * returns; a successful upload removes the entry and the local copy.
 */

const store = new MMKV({ id: 'revv-attachment-queue' })
const KEY = 'entries'
const DIR = `${FileSystem.documentDirectory ?? ''}pending-uploads/`

export interface QueueEntry {
  readonly id: string
  readonly serviceRecordId: string
  readonly vehicleId: string
  readonly localUri: string
  readonly mimeType: string
  readonly kind: 'receipt' | 'photo'
  readonly queuedAt: string
}

function read(): QueueEntry[] {
  const raw = store.getString(KEY)
  if (raw == null) return []
  try {
    return JSON.parse(raw) as QueueEntry[]
  } catch {
    return []
  }
}

function write(entries: QueueEntry[]): void {
  store.set(KEY, JSON.stringify(entries))
}

export function queuedFor(serviceRecordId: string): QueueEntry[] {
  return read().filter((e) => e.serviceRecordId === serviceRecordId)
}

export function queueSize(): number {
  return read().length
}

/** Copy the picked file into the app dir and persist a queue entry. */
export async function enqueueAttachment(input: {
  serviceRecordId: string
  vehicleId: string
  sourceUri: string
  mimeType: string
  kind: 'receipt' | 'photo'
}): Promise<QueueEntry> {
  await FileSystem.makeDirectoryAsync(DIR, { intermediates: true }).catch(() => undefined)
  const id = newId()
  const localUri = `${DIR}${id}`
  await FileSystem.copyAsync({ from: input.sourceUri, to: localUri })

  const entry: QueueEntry = {
    id,
    serviceRecordId: input.serviceRecordId,
    vehicleId: input.vehicleId,
    localUri,
    mimeType: input.mimeType,
    kind: input.kind,
    queuedAt: new Date().toISOString(),
  }
  write([...read(), entry])
  return entry
}

export async function removeEntry(id: string): Promise<void> {
  const entry = read().find((e) => e.id === id)
  write(read().filter((e) => e.id !== id))
  if (entry) await FileSystem.deleteAsync(entry.localUri, { idempotent: true }).catch(() => undefined)
}

/**
 * Upload every pending entry via `uploadOne`. Stops on the first failure that is not
 * a permanent rejection (so a flaky connection is retried next drain); a permanent
 * 4xx removes the entry (the file is bad — don't retry forever).
 */
export async function drainQueue(
  uploadOne: (entry: QueueEntry) => Promise<{ ok: true } | { ok: false; permanent: boolean }>,
): Promise<void> {
  for (const entry of read()) {
    const result = await uploadOne(entry)
    if (result.ok) {
      await removeEntry(entry.id)
      continue
    }
    if (result.permanent) {
      await removeEntry(entry.id)
      continue
    }
    return // transient failure — try again on the next drain
  }
}
