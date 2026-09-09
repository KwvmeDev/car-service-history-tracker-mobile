import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react-native'

import { recordKeys } from '@/features/service-records/hooks'

import * as mechanicApi from './api'
import {
  mechanicKeys,
  useAcceptSubmission,
  useMechanicSubmissions,
  useRejectSubmission,
} from './hooks'
import type { MechanicSubmission } from './types'

jest.mock('./api')
const mockApi = jest.mocked(mechanicApi)

const VEHICLE = 'v1'

const sub = (id: string): MechanicSubmission => ({
  id,
  vehicleId: VEHICLE,
  serviceTypeKey: 'oil_change',
  performedOn: '2026-09-10',
  mileage: 61_000,
  costMinor: 6_500,
  costCurrency: 'USD',
  shopName: 'Downtown Auto',
  notes: null,
  status: 'pending',
  serviceRecordId: null,
  reviewedAt: null,
  createdAt: '2026-09-11T00:00:00.000Z',
})

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}
const freshClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })

const queue = (c: QueryClient) =>
  c.getQueryData<MechanicSubmission[]>(mechanicKeys.submissions(VEHICLE)) ?? []

describe('useMechanicSubmissions', () => {
  it('loads the pending queue', async () => {
    mockApi.listSubmissions.mockResolvedValue([sub('a'), sub('b')])
    const client = freshClient()
    const { result } = renderHook(() => useMechanicSubmissions(VEHICLE), { wrapper: wrapper(client) })

    await waitFor(() => {
      expect(result.current.data).toHaveLength(2)
    })
    expect(mockApi.listSubmissions).toHaveBeenCalledWith(VEHICLE, 'pending')
  })
})

describe('useAcceptSubmission', () => {
  it('optimistically drops the row and invalidates the timeline on success', async () => {
    mockApi.acceptSubmission.mockResolvedValue({ ...sub('a'), status: 'accepted', serviceRecordId: 'rec1' })
    const client = freshClient()
    client.setQueryData(mechanicKeys.submissions(VEHICLE), [sub('a'), sub('b')])
    const spy = jest.spyOn(client, 'invalidateQueries')

    const { result } = renderHook(() => useAcceptSubmission(VEHICLE), { wrapper: wrapper(client) })
    act(() => {
      result.current.mutate('a')
    })

    await waitFor(() => {
      expect(queue(client).map((s) => s.id)).toEqual(['b'])
    })
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(spy).toHaveBeenCalledWith({ queryKey: recordKeys.list(VEHICLE) })
  })

  it('rolls the row back into the queue on error', async () => {
    mockApi.acceptSubmission.mockRejectedValue(new Error('offline'))
    const client = freshClient()
    client.setQueryData(mechanicKeys.submissions(VEHICLE), [sub('a')])

    const { result } = renderHook(() => useAcceptSubmission(VEHICLE), { wrapper: wrapper(client) })
    act(() => {
      result.current.mutate('a')
    })
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(queue(client).map((s) => s.id)).toEqual(['a'])
  })
})

describe('useRejectSubmission', () => {
  it('optimistically drops the row', async () => {
    mockApi.rejectSubmission.mockResolvedValue({ ...sub('a'), status: 'rejected' })
    const client = freshClient()
    client.setQueryData(mechanicKeys.submissions(VEHICLE), [sub('a'), sub('b')])

    const { result } = renderHook(() => useRejectSubmission(VEHICLE), { wrapper: wrapper(client) })
    act(() => {
      result.current.mutate('b')
    })
    await waitFor(() => {
      expect(queue(client).map((s) => s.id)).toEqual(['a'])
    })
  })
})
