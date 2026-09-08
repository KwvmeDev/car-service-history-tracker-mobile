import { useCallback, useEffect } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { onlineManager, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/api/errors'
import { recordKeys } from '@/features/service-records/hooks'

import { deleteAttachment, uploadAttachment } from './api'
import { drainQueue, enqueueAttachment, queueSize, type QueueEntry } from './queue'

async function uploadEntry(entry: QueueEntry): Promise<{ ok: true } | { ok: false; permanent: boolean }> {
  try {
    await uploadAttachment({
      serviceRecordId: entry.serviceRecordId,
      fileUri: entry.localUri,
      mimeType: entry.mimeType,
      kind: entry.kind,
    })
    return { ok: true }
  } catch (err) {
    // 4xx (bad file, gone record) = permanent; network / 5xx = try again later.
    const permanent = err instanceof ApiError && err.status >= 400 && err.status < 500
    return { ok: false, permanent }
  }
}

/**
 * Drains the offline attachment queue whenever connectivity returns and once on
 * mount. Mount this near the top of the app (or the profile screen). After a drain
 * it refetches the affected timelines so the new attachments appear.
 */
export function useAttachmentUploadQueue(): void {
  const qc = useQueryClient()

  const drain = useCallback(() => {
    if (queueSize() === 0) return
    void drainQueue(uploadEntry).then(() => {
      void qc.invalidateQueries({ queryKey: recordKeys.all })
    })
  }, [qc])

  useEffect(() => {
    drain()
    return onlineManager.subscribe((online) => {
      if (online) drain()
    })
  }, [drain])
}

/**
 * Capture a photo (camera or library) and attach it to a record. Online → uploads
 * now. Offline → the file is copied to the app dir and queued; the queue drains on
 * reconnect. Either way the UI shows the record with a pending attachment count.
 */
export function useAttachToRecord(vehicleId: string, serviceRecordId: string) {
  const qc = useQueryClient()

  return useCallback(
    async (source: 'camera' | 'library'): Promise<void> => {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) return

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({ quality: 0.8, exif: false })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              quality: 0.8,
              exif: false,
            })
      if (result.canceled || result.assets.length === 0) return
      const asset = result.assets[0]
      if (!asset) return

      const mimeType = asset.mimeType ?? 'image/jpeg'

      if (onlineManager.isOnline()) {
        try {
          await uploadAttachment({
            serviceRecordId,
            fileUri: asset.uri,
            mimeType,
            kind: 'photo',
          })
          await qc.invalidateQueries({ queryKey: recordKeys.list(vehicleId) })
          return
        } catch {
          // fall through to the offline queue on any failure
        }
      }

      await enqueueAttachment({
        serviceRecordId,
        vehicleId,
        sourceUri: asset.uri,
        mimeType,
        kind: 'photo',
      })
      await qc.invalidateQueries({ queryKey: recordKeys.list(vehicleId) })
    },
    [qc, serviceRecordId, vehicleId],
  )
}

export function useRemoveAttachment(vehicleId: string) {
  const qc = useQueryClient()
  return useCallback(
    async (id: string): Promise<void> => {
      await deleteAttachment(id)
      await qc.invalidateQueries({ queryKey: recordKeys.list(vehicleId) })
    },
    [qc, vehicleId],
  )
}
