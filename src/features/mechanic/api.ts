import { api } from '@/api/client'
import { unwrap } from '@/api/errors'

import type { CreatedMechanicLink, MechanicLink, MechanicSubmission } from './types'

/** Thin transport — one call each, no logic (engineering-standards.md §Layering). */

export async function listLinks(vehicleId: string): Promise<MechanicLink[]> {
  return unwrap(
    await api.GET('/v1/vehicles/{vehicleId}/mechanic-links', { params: { path: { vehicleId } } }),
  ).data
}

export async function createLink(vehicleId: string, label?: string): Promise<CreatedMechanicLink> {
  return unwrap(
    await api.POST('/v1/vehicles/{vehicleId}/mechanic-links', {
      params: { path: { vehicleId } },
      body: label != null && label.trim().length > 0 ? { label: label.trim() } : {},
    }),
  )
}

export async function revokeLink(id: string): Promise<void> {
  unwrap(await api.POST('/v1/mechanic-links/{id}/revoke', { params: { path: { id } } }))
}

export async function listSubmissions(
  vehicleId: string,
  status?: 'pending' | 'accepted' | 'rejected',
): Promise<MechanicSubmission[]> {
  return unwrap(
    await api.GET('/v1/vehicles/{vehicleId}/mechanic-submissions', {
      params: { path: { vehicleId }, query: status ? { status } : {} },
    }),
  ).data
}

export async function acceptSubmission(id: string): Promise<MechanicSubmission> {
  return unwrap(await api.POST('/v1/mechanic-submissions/{id}/accept', { params: { path: { id } } }))
}

export async function rejectSubmission(id: string): Promise<MechanicSubmission> {
  return unwrap(await api.POST('/v1/mechanic-submissions/{id}/reject', { params: { path: { id } } }))
}
