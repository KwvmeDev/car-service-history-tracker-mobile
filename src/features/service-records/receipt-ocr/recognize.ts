import TextRecognition from '@react-native-ml-kit/text-recognition'

/**
 * On-device text recognition for a receipt photo (Sprint 9). Google ML Kit runs
 * fully on the device — the image never leaves the phone. Needs a dev / EAS build
 * (the native module is not in Expo Go); `recognize.web.ts` is an inert stub so
 * the Metro web bundle keeps building.
 */

export interface RecognizedReceipt {
  /** The full recognised text, newline-separated by line. */
  readonly text: string
}

export const ocrSupported = true

export async function recognizeReceipt(imageUri: string): Promise<RecognizedReceipt> {
  const result = await TextRecognition.recognize(imageUri)
  return { text: result.text }
}
