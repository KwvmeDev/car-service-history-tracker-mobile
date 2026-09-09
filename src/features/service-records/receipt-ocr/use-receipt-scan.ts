import { useCallback, useState } from 'react'
import * as ImagePicker from 'expo-image-picker'

import { todayIso } from '@/features/reminders/status'

import { parseReceipt, type ReceiptExtraction } from './parse-receipt'
import { ocrSupported, recognizeReceipt } from './recognize'

export type ReceiptScanState = 'idle' | 'working' | 'done' | 'error' | 'unsupported'

/**
 * Drives the "scan a receipt" flow (Sprint 9): pick / take a photo → on-device
 * OCR → the pure parser → candidate fields. The caller pre-fills the log form and
 * the user confirms; nothing here saves anything.
 */
export function useReceiptScan() {
  const [state, setState] = useState<ReceiptScanState>(ocrSupported ? 'idle' : 'unsupported')
  const [extraction, setExtraction] = useState<ReceiptExtraction | null>(null)

  const scan = useCallback(async (source: 'camera' | 'library'): Promise<void> => {
    if (!ocrSupported) return

    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 1, exif: false })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1, exif: false })
    if (result.canceled) return
    const asset = result.assets[0]
    if (!asset) return

    setState('working')
    try {
      const { text } = await recognizeReceipt(asset.uri)
      setExtraction(parseReceipt(text, { today: todayIso() }))
      setState('done')
    } catch {
      setExtraction(null)
      setState('error')
    }
  }, [])

  const reset = useCallback(() => {
    setExtraction(null)
    setState(ocrSupported ? 'idle' : 'unsupported')
  }, [])

  return { state, extraction, scan, reset }
}
