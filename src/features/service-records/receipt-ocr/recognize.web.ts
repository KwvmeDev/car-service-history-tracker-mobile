/**
 * Web has no on-device ML Kit build. Receipt scanning is a device feature; the
 * Expo Router web target is a preview. Keep the signature in step with
 * `recognize.ts`.
 */

export interface RecognizedReceipt {
  readonly text: string
}

export const ocrSupported = false

export function recognizeReceipt(): Promise<RecognizedReceipt> {
  return Promise.reject(new Error('receipt scanning is not available on web'))
}
