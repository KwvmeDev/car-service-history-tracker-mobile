import { api } from '@/api/client'
import { unwrap } from '@/api/errors'

import type {
  CreateServiceRecordBody,
  PatchServiceRecordBody,
  ServiceRecord,
  ServiceType,
} from './types'

/** Thin transport — one call each, no logic (engineering-standards.md §Layering). */

export async function listServiceRecords(vehicleId: string): Promise<ServiceRecord[]> {
  const page = unwrap(
    await api.GET('/v1/vehicles/{vehicleId}/service-records', {
      params: { path: { vehicleId }, query: { limit: 100 } },
    }),
  )
  return page.data
}

export async function getServiceRecord(id: string): Promise<ServiceRecord> {
  return unwrap(await api.GET('/v1/service-records/{id}', { params: { path: { id } } }))
}

export async function createServiceRecord(
  vehicleId: string,
  body: CreateServiceRecordBody,
): Promise<ServiceRecord> {
  return unwrap(
    await api.POST('/v1/vehicles/{vehicleId}/service-records', {
      params: { path: { vehicleId } },
      body,
    }),
  )
}

export async function patchServiceRecord(
  id: string,
  body: PatchServiceRecordBody,
): Promise<ServiceRecord> {
  return unwrap(await api.PATCH('/v1/service-records/{id}', { params: { path: { id } }, body }))
}

export async function deleteServiceRecord(id: string): Promise<void> {
  unwrap(await api.DELETE('/v1/service-records/{id}', { params: { path: { id } } }))
}

export async function listServiceTypes(): Promise<ServiceType[]> {
  return unwrap(await api.GET('/v1/service-types')).data
}
