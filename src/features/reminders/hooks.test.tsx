import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react-native'

import { isPending } from '@/data/pending'
import { vehicleKeys } from '@/features/vehicles/hooks'
import type { Vehicle } from '@/features/vehicles/types'

import * as reminderApi from './api'
import { reminderKeys, useCompleteReminder, useCreateReminder, worstStatus } from './hooks'
import { todayIso } from './status'
import type { Reminder } from './types'

jest.mock('./api')
const mockApi = jest.mocked(reminderApi)

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

const VEHICLE = '01920000-0000-7000-8000-0000000000v1'
const RID = '01920000-0000-7000-8000-0000000000aa'

const serverReminder = (over: Partial<Reminder> = {}): Reminder => ({
  id: RID,
  vehicleId: VEHICLE,
  serviceTypeKey: 'oil_change',
  title: 'Oil change',
  intervalMiles: 5_000,
  intervalMonths: null,
  lastCompletedOn: todayIso(),
  lastCompletedMileage: 46_300,
  status: 'ok',
  milesRemaining: 5_000,
  daysRemaining: null,
  dueMileage: 51_300,
  dueDate: null,
  createdAt: '2026-09-08T00:00:00.000Z',
  updatedAt: '2026-09-08T00:00:00.000Z',
  ...over,
})

const listOf = (c: QueryClient) => c.getQueryData<Reminder[]>(reminderKeys.list(VEHICLE)) ?? []

function clientWithVehicle(mileage: number): QueryClient {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  client.setQueryData(reminderKeys.list(VEHICLE), [])
  client.setQueryData<Vehicle>(vehicleKeys.detail(VEHICLE), {
    id: VEHICLE,
    currentMileage: mileage,
    mileageUnit: 'mi',
  } as Vehicle)
  return client
}

describe('useCreateReminder (optimistic — ADR 0004)', () => {
  it('stamps the reminder in pending, anchored to the vehicle mileage, then reconciles', async () => {
    const client = clientWithVehicle(41_200)
    mockApi.createReminder.mockResolvedValue(serverReminder({ lastCompletedMileage: 41_200, dueMileage: 46_200 }))

    const { result } = renderHook(() => useCreateReminder(VEHICLE), { wrapper: wrapper(client) })
    act(() => {
      result.current.mutate({ id: RID, title: 'Oil change', intervalMiles: 5_000, intervalMonths: null })
    })

    await waitFor(() => {
      expect(listOf(client)).toHaveLength(1)
      expect(isPending(listOf(client)[0])).toBe(true)
    })
    // computed locally from the 41,200 anchor: due at 46,200
    expect(listOf(client)[0]?.dueMileage).toBe(46_200)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(isPending(listOf(client)[0])).toBe(false)
  })

  it('rolls the reminder back off the list when the create fails', async () => {
    const client = clientWithVehicle(41_200)
    mockApi.createReminder.mockRejectedValue(Object.assign(new Error('offline'), { status: undefined }))

    const { result } = renderHook(() => useCreateReminder(VEHICLE), { wrapper: wrapper(client) })
    act(() => {
      result.current.mutate({ id: RID, title: 'x', intervalMiles: 1_000, intervalMonths: null })
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(listOf(client)).toEqual([])
  })
})

describe('useCompleteReminder', () => {
  it('drains an overdue reminder in place: status → ok, next due recomputed', async () => {
    const client = clientWithVehicle(46_300)
    client.setQueryData<Reminder[]>(reminderKeys.list(VEHICLE), [
      serverReminder({
        status: 'overdue',
        lastCompletedMileage: 41_200,
        lastCompletedOn: '2026-01-01',
        dueMileage: 46_200,
        milesRemaining: -100,
      }),
    ])
    mockApi.patchReminder.mockResolvedValue(serverReminder())

    const { result } = renderHook(() => useCompleteReminder(VEHICLE), { wrapper: wrapper(client) })
    act(() => {
      result.current.mutate(RID)
    })

    await waitFor(() => {
      const row = listOf(client)[0]
      expect(row?.status).toBe('ok')
      expect(row?.dueMileage).toBe(51_300)
    })
    expect(mockApi.patchReminder).toHaveBeenCalledWith(RID, { markCompleted: true })
  })
})

describe('worstStatus', () => {
  it('reports the most urgent status in the set', () => {
    expect(worstStatus(undefined)).toBe('ok')
    expect(worstStatus([{ status: 'ok' }, { status: 'due' }])).toBe('due')
    expect(worstStatus([{ status: 'due' }, { status: 'overdue' }, { status: 'ok' }])).toBe('overdue')
  })
})
