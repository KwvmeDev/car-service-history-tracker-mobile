import { api } from '@/api/client'
import { unwrap } from '@/api/errors'

interface VehiclePhotoUploadSignature {
  cloudName: string
  apiKey: string
  timestamp: number
  folder: string
  signature: string
}

/**
 * Direct-to-Cloudinary vehicle photo upload. revv-api mints a signature (never sees
 * the image bytes); this hand-built `fetch` sends the file straight to Cloudinary,
 * mirroring the multipart exception attachments/api.ts uses for the same reason
 * (engineering-standards.md). The photo is optional — callers should let creation
 * proceed on failure rather than blocking on it.
 */
export async function uploadVehiclePhoto(fileUri: string, mimeType: string): Promise<string> {
  const sig: VehiclePhotoUploadSignature = unwrap(
    await api.POST('/v1/uploads/vehicle-photo-signature'),
  )

  const form = new FormData()
  form.append('file', {
    uri: fileUri,
    name: `upload.${mimeType.split('/')[1] ?? 'jpg'}`,
    type: mimeType,
  } as unknown as Blob)
  form.append('api_key', sig.apiKey)
  form.append('timestamp', String(sig.timestamp))
  form.append('folder', sig.folder)
  form.append('signature', sig.signature)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  })
  if (!response.ok) {
    throw new Error(`Cloudinary upload failed (${String(response.status)})`)
  }
  const body = (await response.json()) as { secure_url: string }
  return body.secure_url
}
