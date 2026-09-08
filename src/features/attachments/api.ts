import { apiBaseUrl } from '@/api/base-url'
import { ApiError, NetworkError } from '@/api/errors'
import { getSessionToken } from '@/features/auth/session-store'

import type { Attachment } from '@/features/service-records/types'

/**
 * Attachment upload is the one multipart request in the app — `openapi-fetch` is
 * JSON-shaped, so this is a hand-built `fetch` (engineering-standards.md allows the
 * exception for multipart). It still goes through the same base URL and the same
 * SecureStore bearer token as the generated client.
 */
export async function uploadAttachment(input: {
  serviceRecordId: string
  fileUri: string
  mimeType: string
  kind: 'receipt' | 'photo'
}): Promise<Attachment> {
  const form = new FormData()
  form.append('file', {
    uri: input.fileUri,
    name: `upload.${input.mimeType.split('/')[1] ?? 'bin'}`,
    type: input.mimeType,
  } as unknown as Blob)

  const token = await getSessionToken()
  const url = new URL(
    `/v1/service-records/${input.serviceRecordId}/attachments`,
    apiBaseUrl,
  )
  url.searchParams.set('kind', input.kind)

  let response: Response
  try {
    response = await fetch(url.toString(), {
      method: 'POST',
      headers: token != null ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    })
  } catch {
    throw new NetworkError()
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => undefined)
    throw new ApiError(response.status, body)
  }
  return (await response.json()) as Attachment
}

export async function deleteAttachment(id: string): Promise<void> {
  const token = await getSessionToken()
  const res = await fetch(new URL(`/v1/attachments/${id}`, apiBaseUrl).toString(), {
    method: 'DELETE',
    headers: token != null ? { Authorization: `Bearer ${token}` } : {},
  }).catch(() => {
    throw new NetworkError()
  })
  if (!res.ok && res.status !== 404) throw new ApiError(res.status, await res.json().catch(() => undefined))
}
