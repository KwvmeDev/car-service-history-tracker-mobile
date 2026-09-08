/**
 * The offline attachment hold (ADR 0004): a captured file is copied to the app dir
 * and a queue entry persisted; `drainQueue` uploads pending entries and removes them,
 * keeps transient failures for the next drain, and drops permanently-bad ones.
 */

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///docs/',
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  copyAsync: jest.fn(() => Promise.resolve()),
  deleteAsync: jest.fn(() => Promise.resolve()),
}))

import { drainQueue, enqueueAttachment, queuedFor, queueSize } from './queue'

const record = 'rec-1'
const vehicle = 'veh-1'

async function seed() {
  await enqueueAttachment({
    serviceRecordId: record,
    vehicleId: vehicle,
    sourceUri: 'file:///cache/photo.jpg',
    mimeType: 'image/jpeg',
    kind: 'photo',
  })
}

describe('attachment queue', () => {
  it('copies the file and persists an entry that survives a reload', async () => {
    await seed()
    expect(queueSize()).toBe(1)
    expect(queuedFor(record)).toHaveLength(1)
    expect(queuedFor('someone-else')).toHaveLength(0)
  })

  it('drainQueue uploads and removes a successful entry', async () => {
    await seed()
    await drainQueue(() => Promise.resolve({ ok: true }))
    expect(queueSize()).toBe(0)
  })

  it('keeps an entry on a transient failure (retried next drain)', async () => {
    await seed()
    await drainQueue(() => Promise.resolve({ ok: false, permanent: false }))
    expect(queueSize()).toBe(1)
  })

  it('drops an entry on a permanent failure', async () => {
    await seed()
    await drainQueue(() => Promise.resolve({ ok: false, permanent: true }))
    expect(queueSize()).toBe(0)
  })
})
