import { api } from '@/api/client'

import type { ReceiptExtraction } from './parse-receipt'
import { proposedFields } from './parse-receipt'

/**
 * Accuracy telemetry for the receipt parser (Sprint 9). Fire-and-forget: which
 * fields the parser proposed, and which of those the user kept unchanged when they
 * saved. Booleans only — no values, no image, no receipt text leaves the device.
 */

export interface FieldFlags {
  cost: boolean
  date: boolean
  shop: boolean
  odometer: boolean
}

export interface AcceptedComparison {
  /** The field values the parser pre-filled. */
  readonly filled: { costMinor: number | null; performedOn: string | null; shopName: string | null; odometer: number | null }
  /** The field values as saved. */
  readonly saved: { costMinor: number | null; performedOn: string | null; shopName: string | null; odometer: number | null }
}

/** A field was "accepted" if it was pre-filled and the saved value still matches. */
export function acceptedFields(cmp: AcceptedComparison): FieldFlags {
  return {
    cost: cmp.filled.costMinor != null && cmp.filled.costMinor === cmp.saved.costMinor,
    date: cmp.filled.performedOn != null && cmp.filled.performedOn === cmp.saved.performedOn,
    shop: cmp.filled.shopName != null && cmp.filled.shopName === cmp.saved.shopName,
    odometer: cmp.filled.odometer != null && cmp.filled.odometer === cmp.saved.odometer,
  }
}

export async function reportOcrOutcome(
  extraction: ReceiptExtraction,
  comparison: AcceptedComparison,
): Promise<void> {
  try {
    await api.POST('/v1/ocr-events', {
      body: {
        proposed: proposedFields(extraction),
        accepted: acceptedFields(comparison),
      },
    })
  } catch {
    // telemetry must never disrupt the log flow
  }
}
