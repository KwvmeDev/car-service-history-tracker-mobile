import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import * as prefsApi from './preferences-api'
import type { NotificationPreferences, NotificationPreferencesPatch } from './types'

export const notificationKeys = {
  all: ['notification-preferences'] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
}

/** The all-on defaults revv-api returns for a user who has never set preferences. */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  remindersDue: true,
  remindersOverdue: true,
  remindersUpcoming: true,
  quietHoursStart: null,
  quietHoursEnd: null,
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: prefsApi.getNotificationPreferences,
  })
}

/** PATCH — optimistic, mirroring the reminders / service-records hook pattern. */
export function useUpdateNotificationPreferences() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: NotificationPreferencesPatch) =>
      prefsApi.updateNotificationPreferences(patch),
    onMutate: (patch) => {
      const key = notificationKeys.preferences()
      const previous = qc.getQueryData<NotificationPreferences>(key)
      const base = previous ?? DEFAULT_NOTIFICATION_PREFERENCES
      qc.setQueryData<NotificationPreferences>(key, { ...base, ...patch })
      return { previous }
    },
    onError: (_err, _patch, ctx) => {
      if (ctx?.previous) qc.setQueryData(notificationKeys.preferences(), ctx.previous)
    },
    onSuccess: (server) => {
      qc.setQueryData(notificationKeys.preferences(), server)
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.preferences() })
    },
  })
}
