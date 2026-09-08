import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react-native'

import * as prefsApi from './preferences-api'
import {
  notificationKeys,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from './preferences-hooks'
import type { NotificationPreferences } from './types'

jest.mock('./preferences-api')
const mockApi = jest.mocked(prefsApi)

const ALL_ON: NotificationPreferences = {
  remindersDue: true,
  remindersOverdue: true,
  remindersUpcoming: true,
  quietHoursStart: null,
  quietHoursEnd: null,
}

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

function freshClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

describe('useNotificationPreferences', () => {
  it('loads the preferences', async () => {
    mockApi.getNotificationPreferences.mockResolvedValue(ALL_ON)
    const client = freshClient()
    const { result } = renderHook(() => useNotificationPreferences(), { wrapper: wrapper(client) })

    await waitFor(() => {
      expect(result.current.data).toEqual(ALL_ON)
    })
  })
})

describe('useUpdateNotificationPreferences', () => {
  it('optimistically toggles then rolls back on error', async () => {
    mockApi.updateNotificationPreferences.mockRejectedValue(new Error('5xx'))
    const client = freshClient()
    client.setQueryData(notificationKeys.preferences(), ALL_ON)

    const { result } = renderHook(() => useUpdateNotificationPreferences(), {
      wrapper: wrapper(client),
    })

    act(() => {
      result.current.mutate({ remindersUpcoming: false })
    })

    // optimistic
    await waitFor(() => {
      expect(
        client.getQueryData<NotificationPreferences>(notificationKeys.preferences())?.remindersUpcoming,
      ).toBe(false)
    })

    // rolled back
    await waitFor(() => {
      expect(
        client.getQueryData<NotificationPreferences>(notificationKeys.preferences())?.remindersUpcoming,
      ).toBe(true)
    })
  })

  it('writes the server response into the cache on success', async () => {
    const server: NotificationPreferences = { ...ALL_ON, remindersDue: false }
    mockApi.updateNotificationPreferences.mockResolvedValue(server)
    const client = freshClient()
    client.setQueryData(notificationKeys.preferences(), ALL_ON)

    const { result } = renderHook(() => useUpdateNotificationPreferences(), {
      wrapper: wrapper(client),
    })
    act(() => {
      result.current.mutate({ remindersDue: false })
    })

    await waitFor(() => {
      expect(client.getQueryData(notificationKeys.preferences())).toEqual(server)
    })
  })
})
