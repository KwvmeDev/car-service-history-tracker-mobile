import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react-native'

import { isPending } from '@/data/pending'

import * as vehicleApi from './api'
import { useCreateVehicle, useVehicles, vehicleKeys } from './hooks'
import type { Vehicle, VehicleListItem } from './types'

const listOf = (client: QueryClient): VehicleListItem[] =>
  client.getQueryData<VehicleListItem[]>(vehicleKeys.list()) ?? []

jest.mock('./api')
const mockApi = jest.mocked(vehicleApi)

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

const serverVehicle = (id: string): Vehicle => ({
  id,
  vin: '1HGCM82633A004352',
  year: 2003,
  make: 'Honda',
  model: 'Accord',
  trim: 'EX',
  nickname: null,
  currentMileage: null,
  mileageUnit: 'mi',
  photoUrl: null,
  ownedSince: null,
  vinDecode: null,
  createdAt: '2026-09-07T00:00:00.000Z',
  updatedAt: '2026-09-07T00:00:00.000Z',
})

describe('useCreateVehicle (optimistic — ADR 0004)', () => {
  it('inserts the row immediately marked pending, then reconciles by id on success', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    client.setQueryData(vehicleKeys.list(), [])
    mockApi.createVehicle.mockResolvedValue(serverVehicle('11111111-1111-7111-8111-111111111111'))

    const { result } = renderHook(() => useCreateVehicle(), { wrapper: wrapper(client) })

    act(() => {
      result.current.mutate({ id: '11111111-1111-7111-8111-111111111111', vin: '1HGCM82633A004352' })
    })

    // optimistic: present and pending, before the server responds
    await waitFor(() => {
      expect(listOf(client)).toHaveLength(1)
      expect(isPending(listOf(client)[0])).toBe(true)
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(listOf(client)[0]?.make).toBe('Honda')
  })

  it('rolls the row back out of the garage when the create fails', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    client.setQueryData(vehicleKeys.list(), [])
    mockApi.createVehicle.mockRejectedValue(Object.assign(new Error('offline'), { status: undefined }))

    const { result } = renderHook(() => useCreateVehicle(), { wrapper: wrapper(client) })

    act(() => {
      result.current.mutate({ id: '22222222-2222-7222-8222-222222222222' })
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(listOf(client)).toEqual([])
  })
})

describe('useVehicles', () => {
  it('reads the list through the api', async () => {
    const client = new QueryClient()
    mockApi.listVehicles.mockResolvedValue([])
    const { result } = renderHook(() => useVehicles(), { wrapper: wrapper(client) })
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(mockApi.listVehicles).toHaveBeenCalled()
  })
})
