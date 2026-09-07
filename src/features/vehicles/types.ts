import type { paths } from '@/api/client'

/** The canonical vehicle row, exactly as revv-api returns it (generated from the spec). */
export type Vehicle =
  paths['/v1/vehicles/{id}']['get']['responses']['200']['content']['application/json']

/** The list row (GET /v1/vehicles) — omits the vinDecode blob. */
export type VehicleListItem =
  paths['/v1/vehicles']['get']['responses']['200']['content']['application/json']['data'][number]

/** Body for POST /v1/vehicles — the client supplies `id`. */
export type CreateVehicleBody =
  paths['/v1/vehicles']['post']['requestBody']['content']['application/json']

/** Body for PATCH /v1/vehicles/{id}. */
export type PatchVehicleBody = NonNullable<
  paths['/v1/vehicles/{id}']['patch']['requestBody']
>['content']['application/json']

export type DecodeVinResult =
  paths['/v1/vehicles/{id}/decode-vin']['post']['responses']['200']['content']['application/json']

/** A display name for a vehicle — the nickname, else "year make model", else "New vehicle". */
export function vehicleTitle(v: Pick<VehicleListItem, 'nickname' | 'year' | 'make' | 'model'>): string {
  if (v.nickname != null && v.nickname.trim().length > 0) return v.nickname
  const parts = [v.year, v.make, v.model].filter((p): p is string | number => p != null && p !== '')
  return parts.length > 0 ? parts.join(' ') : 'New vehicle'
}
