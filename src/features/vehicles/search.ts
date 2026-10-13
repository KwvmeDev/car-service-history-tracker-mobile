import type { VehicleListItem } from './types'

/** Matches a vehicle against a free-text query over nickname/VIN/make/model. */
export function matchesVehicleQuery(vehicle: VehicleListItem, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (q.length === 0) return true
  return [vehicle.nickname, vehicle.vin, vehicle.make, vehicle.model]
    .filter((v): v is string => v != null)
    .some((v) => v.toLowerCase().includes(q))
}
