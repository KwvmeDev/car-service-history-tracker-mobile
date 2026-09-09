import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react-native'

import { isPending } from '@/data/pending'
import { vehicleKeys } from '@/features/vehicles/hooks'
import type { Vehicle } from '@/features/vehicles/types'

import * as recordApi from './api'
import { recordKeys, useLogServiceRecord } from './hooks'
import type { ServiceRecord } from './types'

jest.mock('./api')
const mockApi = jest.mocked(recordApi)

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

const VEHICLE = '01920000-0000-7000-8000-0000000000v1'

const serverRecord = (over: Partial<ServiceRecord> = {}): ServiceRecord => ({
  id: '01920000-0000-7000-8000-000000000001',
  vehicleId: VEHICLE,
  serviceTypeKey: 'oil_change',
  performedOn: '2026-09-01',
  mileage: 41_250,
  costMinor: null,
  costCurrency: null,
  shopName: null,
  notes: null,
  origin: 'owner',
  attachments: [],
  createdAt: '2026-09-08T00:00:00.000Z',
  updatedAt: '2026-09-08T00:00:00.000Z',
  ...over,
})

const listOf = (c: QueryClient) => c.getQueryData<ServiceRecord[]>(recordKeys.list(VEHICLE)) ?? []

describe('useLogServiceRecord (optimistic — ADR 0004)', () => {
  it('stamps the entry onto the timeline marked pending, then reconciles by id', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    client.setQueryData(recordKeys.list(VEHICLE), [])
    mockApi.createServiceRecord.mockResolvedValue(serverRecord())

    const { result } = renderHook(() => useLogServiceRecord(VEHICLE), { wrapper: wrapper(client) })
    act(() => {
      result.current.mutate({
        id: '01920000-0000-7000-8000-000000000001',
        serviceTypeKey: 'oil_change',
        performedOn: '2026-09-01',
        mileage: 41_250,
      })
    })

    await waitFor(() => {
      expect(listOf(client)).toHaveLength(1)
      expect(isPending(listOf(client)[0])).toBe(true)
    })
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(isPending(listOf(client)[0])).toBe(false)
  })

  it('mirrors the mileage rollup into the vehicle cache when the reading is higher', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    client.setQueryData(recordKeys.list(VEHICLE), [])
    client.setQueryData<Vehicle>(vehicleKeys.detail(VEHICLE), {
      id: VEHICLE,
      currentMileage: 40_000,
      mileageUnit: 'mi',
    } as Vehicle)
    mockApi.createServiceRecord.mockResolvedValue(serverRecord())

    const { result } = renderHook(() => useLogServiceRecord(VEHICLE), { wrapper: wrapper(client) })
    act(() => {
      result.current.mutate({
        id: '01920000-0000-7000-8000-000000000001',
        serviceTypeKey: 'oil_change',
        performedOn: '2026-09-01',
        mileage: 41_250,
      })
    })

    await waitFor(() => {
      const v = client.getQueryData<Vehicle>(vehicleKeys.detail(VEHICLE))
      expect(v?.currentMileage).toBe(41_250)
    })
  })

  it('rolls the entry back off the timeline when the log fails', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    client.setQueryData(recordKeys.list(VEHICLE), [])
    mockApi.createServiceRecord.mockRejectedValue(Object.assign(new Error('offline'), { status: undefined }))

    const { result } = renderHook(() => useLogServiceRecord(VEHICLE), { wrapper: wrapper(client) })
    act(() => {
      result.current.mutate({
        id: '01920000-0000-7000-8000-000000000002',
        serviceTypeKey: 'oil_change',
        performedOn: '2026-09-01',
      })
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(listOf(client)).toEqual([])
  })
})
