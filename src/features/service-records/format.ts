import type { ServiceRecord, ServiceType } from './types'

/** `41,250` — grouped integer for a mileage reading. */
export function formatMileage(value: number | null): string {
  return value == null ? '—' : value.toLocaleString('en-US')
}

/** `$45.99` from integer minor units + an ISO code. Falls back to a plain amount. */
export function formatCost(minor: number | null, currency: string | null): string | null {
  if (minor == null) return null
  const amount = minor / 100
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency ?? 'USD',
    }).format(amount)
  } catch {
    return amount.toFixed(2)
  }
}

/** `15 Jan 2026` from an ISO `YYYY-MM-DD` (no timezone shift). */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** The sentence-case label for a service type key, falling back to the key itself. */
export function serviceTypeLabel(key: string, types: ServiceType[] | undefined): string {
  return types?.find((t) => t.key === key)?.label ?? key.replace(/_/g, ' ')
}

/** The secondary line under a timeline entry: "Mike's Auto · 15 Jan 2026". */
export function entrySubtitle(record: Pick<ServiceRecord, 'shopName' | 'performedOn'>): string {
  const date = formatDate(record.performedOn)
  return record.shopName != null && record.shopName.trim().length > 0
    ? `${record.shopName} · ${date}`
    : date
}
