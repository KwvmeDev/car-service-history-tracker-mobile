import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import * as reportApi from './api'
import type { GeneratedReport, ResaleReport } from './types'

export const reportKeys = {
  all: ['resale-reports'] as const,
  list: (vehicleId: string) => [...reportKeys.all, 'list', vehicleId] as const,
}

/**
 * A vehicle's reports. The PDF renders server-side after generation, so this query
 * ignores the app-wide 5-minute `staleTime` (it must reflect a change the client
 * didn't make) and polls every few seconds until every active report's PDF is
 * `ready` or `failed` — that's the link "activating".
 */
export function useVehicleReports(vehicleId: string, enabled = true) {
  return useQuery({
    queryKey: reportKeys.list(vehicleId),
    queryFn: () => reportApi.listReports(vehicleId),
    enabled,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchIntervalInBackground: true,
    refetchInterval: (query) => {
      const rows = query.state.data
      if (!rows) return 2000
      const anyPending = rows.some((r) => r.status === 'active' && r.pdfStatus === 'pending')
      return anyPending ? 3000 : false
    },
  })
}

function invalidate(qc: ReturnType<typeof useQueryClient>, vehicleId: string): void {
  void qc.invalidateQueries({ queryKey: reportKeys.list(vehicleId) })
}

/**
 * Poll one report's PDF status until it settles (`ready` / `failed` / revoked). Used
 * by the generate flow to "activate" the PDF affordance. Independent of the list
 * query so its enable/stale rules can't interfere.
 */
export function useReportPdfStatus(vehicleId: string, reportId: string | undefined, active: boolean) {
  return useQuery({
    queryKey: [...reportKeys.all, 'pdf', reportId ?? 'none'] as const,
    queryFn: () => reportApi.findReport(vehicleId, reportId ?? ''),
    enabled: active && reportId != null,
    staleTime: 0,
    refetchIntervalInBackground: true,
    refetchInterval: (query) => {
      const r = query.state.data
      if (r == null) return 2000
      return r.status === 'active' && r.pdfStatus === 'pending' ? 2500 : false
    },
  })
}

/** POST — generate. The result carries the share token + link **once**; hold it in state. */
export function useGenerateReport(vehicleId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (): Promise<GeneratedReport> => reportApi.generateReport(vehicleId),
    onSuccess: () => {
      invalidate(qc, vehicleId)
    },
  })
}

/** POST — regenerate: revokes the current report and mints a fresh one. */
export function useRegenerateReport(vehicleId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reportId: string): Promise<GeneratedReport> => reportApi.regenerateReport(reportId),
    onSuccess: () => {
      invalidate(qc, vehicleId)
    },
  })
}

/** POST — revoke: the link and PDF die immediately. Optimistic. */
export function useRevokeReport(vehicleId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reportId: string): Promise<ResaleReport> => reportApi.revokeReport(reportId),
    onMutate: (reportId) => {
      const prev = qc.getQueryData<ResaleReport[]>(reportKeys.list(vehicleId))
      qc.setQueryData<ResaleReport[]>(reportKeys.list(vehicleId), (rows = []) =>
        rows.map((r) =>
          r.id === reportId ? { ...r, status: 'revoked', pdfStatus: 'unavailable' } : r,
        ),
      )
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(reportKeys.list(vehicleId), ctx.prev)
    },
    onSettled: () => {
      invalidate(qc, vehicleId)
    },
  })
}
