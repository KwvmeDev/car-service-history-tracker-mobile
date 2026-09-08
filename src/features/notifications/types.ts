import type { paths } from '@/api/client'

/** The caller's notification preferences, exactly as revv-api returns them. */
export type NotificationPreferences =
  paths['/v1/notification-preferences']['get']['responses']['200']['content']['application/json']

/** Partial body for PATCH /v1/notification-preferences. */
export type NotificationPreferencesPatch = NonNullable<
  paths['/v1/notification-preferences']['patch']['requestBody']
>['content']['application/json']

/** Body for POST /v1/push-tokens. */
export type RegisterPushTokenBody =
  paths['/v1/push-tokens']['post']['requestBody']['content']['application/json']
