import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react-native'

import * as reportApi from './api'
import { reportKeys, useGenerateReport, useRevokeReport, useVehicleReports } from './hooks'
import type { GeneratedReport, ResaleReport } from './types'

jest.mock('./api')
const mockApi = jest.mocked(reportApi)

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

const VEHICLE = '01920000-0000-7000-8000-0000000000v1'

const report = (over: Partial<ResaleReport> = {}): ResaleReport => ({
  id: '01920000-0000-7000-8000-00000000rep1',
  vehicleId: VEHICLE,
  generatedAt: '2026-09-08T12:00:00.000Z',
  revokedAt: null,
  status: 'active',
  pdfStatus: 'ready',
  ...over,
})

describe('useGenerateReport', () => {
  it('returns the one-time token + link and refreshes the list', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const generated: GeneratedReport = {
      report: report({ pdfStatus: 'pending' }),
      shareToken: 'n_e91X4mmAnEUF0-HnzwYw',
      shareUrl: 'http://localhost:3001/r/n_e91X4mmAnEUF0-HnzwYw',
    }
    mockApi.generateReport.mockResolvedValue(generated)

    const { result } = renderHook(() => useGenerateReport(VEHICLE), { wrapper: wrapper(client) })
    let out: GeneratedReport | undefined
    await act(async () => {
      out = await result.current.mutateAsync()
    })
    expect(out?.shareToken).toBe('n_e91X4mmAnEUF0-HnzwYw')
    expect(mockApi.generateReport).toHaveBeenCalledWith(VEHICLE)
  })
})

describe('useRevokeReport (optimistic)', () => {
  it('marks the row revoked immediately, then reconciles', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    client.setQueryData(reportKeys.list(VEHICLE), [report()])
    mockApi.revokeReport.mockResolvedValue(report({ status: 'revoked', pdfStatus: 'unavailable' }))

    const { result } = renderHook(() => useRevokeReport(VEHICLE), { wrapper: wrapper(client) })
    act(() => {
      result.current.mutate('01920000-0000-7000-8000-00000000rep1')
    })

    await waitFor(() => {
      const rows = client.getQueryData<ResaleReport[]>(reportKeys.list(VEHICLE)) ?? []
      expect(rows[0]?.status).toBe('revoked')
      expect(rows[0]?.pdfStatus).toBe('unavailable')
    })
  })

  it('rolls the row back if the revoke fails', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    client.setQueryData(reportKeys.list(VEHICLE), [report()])
    mockApi.revokeReport.mockRejectedValue(new Error('offline'))

    const { result } = renderHook(() => useRevokeReport(VEHICLE), { wrapper: wrapper(client) })
    act(() => {
      result.current.mutate('01920000-0000-7000-8000-00000000rep1')
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    const rows = client.getQueryData<ResaleReport[]>(reportKeys.list(VEHICLE)) ?? []
    expect(rows[0]?.status).toBe('active')
  })
})

describe('useVehicleReports', () => {
  it('fetches a vehicle\'s reports', async () => {
    const client = new QueryClient()
    mockApi.listReports.mockResolvedValue([report({ pdfStatus: 'pending' })])

    const { result } = renderHook(() => useVehicleReports(VEHICLE), { wrapper: wrapper(client) })
    await waitFor(() => {
      expect(result.current.data).toEqual([report({ pdfStatus: 'pending' })])
    })
    expect(mockApi.listReports).toHaveBeenCalledWith(VEHICLE)
  })

  it('is disabled when told to be', () => {
    const client = new QueryClient()
    renderHook(() => useVehicleReports(VEHICLE, false), { wrapper: wrapper(client) })
    expect(mockApi.listReports).not.toHaveBeenCalled()
  })
})
