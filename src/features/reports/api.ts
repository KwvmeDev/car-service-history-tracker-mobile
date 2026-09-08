import { api } from '@/api/client'
import { apiBaseUrl } from '@/api/base-url'
import { unwrap } from '@/api/errors'

import type { GeneratedReport, ResaleReport } from './types'

/** Thin transport — one call each, no logic (engineering-standards.md §Layering). */

export async function listReports(vehicleId: string): Promise<ResaleReport[]> {
  return unwrap(
    // `no-store`: a report's pdfStatus changes server-side (the render worker), so
    // this must never come from the HTTP cache while the flow is polling it.
    await api.GET('/v1/vehicles/{vehicleId}/resale-reports', {
      params: { path: { vehicleId } },
      cache: 'no-store',
    }),
  ).data
}

export async function generateReport(vehicleId: string): Promise<GeneratedReport> {
  return unwrap(
    await api.POST('/v1/vehicles/{vehicleId}/resale-reports', { params: { path: { vehicleId } } }),
  )
}

export async function regenerateReport(id: string): Promise<GeneratedReport> {
  return unwrap(await api.POST('/v1/resale-reports/{id}/regenerate', { params: { path: { id } } }))
}

export async function revokeReport(id: string): Promise<ResaleReport> {
  return unwrap(await api.POST('/v1/resale-reports/{id}/revoke', { params: { path: { id } } }))
}

/** Poll one report's freshest state via the vehicle list (there is no owner GET-by-id).
 *  Returns `null` (never `undefined` — TanStack forbids it) when the id isn't found. */
export async function findReport(
  vehicleId: string,
  reportId: string,
): Promise<ResaleReport | null> {
  const reports = await listReports(vehicleId)
  return reports.find((r) => r.id === reportId) ?? null
}

/** The public PDF download URL for a share token — the API redirects it to a signed URL. */
export function pdfDownloadUrl(shareToken: string): string {
  return `${apiBaseUrl.replace(/\/$/, '')}/v1/r/${encodeURIComponent(shareToken)}/pdf`
}
