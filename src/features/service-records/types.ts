import type { paths } from '@/api/client'

/** A service record exactly as revv-api returns it (generated from the spec). */
export type ServiceRecord =
  paths['/v1/service-records/{id}']['get']['responses']['200']['content']['application/json']

export type Attachment = ServiceRecord['attachments'][number]

/** Body for POST /v1/vehicles/{vehicleId}/service-records — the client supplies `id`. */
export type CreateServiceRecordBody =
  paths['/v1/vehicles/{vehicleId}/service-records']['post']['requestBody']['content']['application/json']

export type PatchServiceRecordBody = NonNullable<
  paths['/v1/service-records/{id}']['patch']['requestBody']
>['content']['application/json']

export type ServiceType =
  paths['/v1/service-types']['get']['responses']['200']['content']['application/json']['data'][number]
