import type { ResaleReport } from './types'

/** `8 Sep 2026` from an RFC 3339 timestamp. */
export function reportDate(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** The one-line status for a report row in the manage list. */
export function reportStatusLabel(report: Pick<ResaleReport, 'status' | 'pdfStatus'>): string {
  if (report.status === 'revoked') return 'Revoked'
  switch (report.pdfStatus) {
    case 'ready':
      return 'Link active · PDF ready'
    case 'pending':
      return 'Link active · preparing PDF'
    case 'failed':
      return 'Link active · PDF unavailable'
    default:
      return 'Link active'
  }
}

/** What to show for the PDF affordance in the generate flow. */
export function pdfState(pdfStatus: ResaleReport['pdfStatus']): 'ready' | 'pending' | 'failed' {
  if (pdfStatus === 'ready') return 'ready'
  if (pdfStatus === 'failed') return 'failed'
  return 'pending'
}
