import { api } from '@/api/client'
import { unwrap } from '@/api/errors'

import type {
  CreateVehicleBody,
  DecodeVinResult,
  PatchVehicleBody,
  Vehicle,
  VehicleListItem,
} from './types'

/** Thin transport functions — one call each, no logic (engineering-standards.md §Layering). */

export async function listVehicles(): Promise<VehicleListItem[]> {
  const page = unwrap(await api.GET('/v1/vehicles', { params: { query: { limit: 100 } } }))
  return page.data
}

export async function getVehicle(id: string): Promise<Vehicle> {
  return unwrap(await api.GET('/v1/vehicles/{id}', { params: { path: { id } } }))
}

export async function createVehicle(body: CreateVehicleBody): Promise<Vehicle> {
  return unwrap(await api.POST('/v1/vehicles', { body }))
}

export async function patchVehicle(id: string, body: PatchVehicleBody): Promise<Vehicle> {
  return unwrap(await api.PATCH('/v1/vehicles/{id}', { params: { path: { id } }, body }))
}

export async function deleteVehicle(id: string): Promise<void> {
  unwrap(await api.DELETE('/v1/vehicles/{id}', { params: { path: { id } } }))
}

export async function decodeVin(id: string): Promise<DecodeVinResult> {
  return unwrap(await api.POST('/v1/vehicles/{id}/decode-vin', { params: { path: { id } } }))
}
