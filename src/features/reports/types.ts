import type { paths } from '@/api/client'

type GenerateResponse =
  paths['/v1/vehicles/{vehicleId}/resale-reports']['post']['responses']['201']['content']['application/json']

/** The owner's view of one report (list + the `report` field of a generate result). */
export type ResaleReport = GenerateResponse['report']

/** A fresh generation — the raw token and link are here **once**. */
export type GeneratedReport = GenerateResponse

export type ReportPdfStatus = ResaleReport['pdfStatus']
