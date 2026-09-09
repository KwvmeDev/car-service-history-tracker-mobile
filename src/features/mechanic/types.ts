import type { paths } from '@/api/client'

export type MechanicLink =
  paths['/v1/vehicles/{vehicleId}/mechanic-links']['get']['responses']['200']['content']['application/json']['data'][number]

export type CreatedMechanicLink =
  paths['/v1/vehicles/{vehicleId}/mechanic-links']['post']['responses']['201']['content']['application/json']

export type MechanicSubmission =
  paths['/v1/vehicles/{vehicleId}/mechanic-submissions']['get']['responses']['200']['content']['application/json']['data'][number]
