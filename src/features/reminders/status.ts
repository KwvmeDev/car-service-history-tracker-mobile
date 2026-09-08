/**
 * Reminder status — the client mirror of the API's pure function
 * (`revv-api/src/services/reminder-status.ts`).
 *
 * The API computes `status` on every read; this exists so the app can recompute
 * locally the instant an optimistic write lands (a new reminder, a "mark done",
 * a mileage rollup) without waiting for a refetch. The two implementations are
 * pinned together by `status.test.ts`, which runs the shared case table
 * (`status.fixtures.ts` — kept byte-identical with the API's copy).
 *
 * Keep this behaviourally identical to the API: the thresholds, and the
 * month/day arithmetic especially.
 */

/** A reminder within this many miles of due reads as "due soon" (amber). */
export const DUE_SOON_MILES = 500
/** A reminder within this many days of due reads as "due soon" (amber). */
export const DUE_SOON_DAYS = 14

export type ReminderStatusValue = 'ok' | 'due' | 'overdue'

export interface ReminderStatusInput {
  readonly intervalMiles: number | null
  readonly intervalMonths: number | null
  readonly lastCompletedOn: string | null
  readonly lastCompletedMileage: number | null
  readonly currentMileage: number | null
  /** Today, as `YYYY-MM-DD`. */
  readonly today: string
}

export interface ReminderStatusResult {
  readonly status: ReminderStatusValue
  readonly milesRemaining: number | null
  readonly daysRemaining: number | null
  readonly dueMileage: number | null
  readonly dueDate: string | null
}

const MS_PER_DAY = 86_400_000

function parseIsoDate(iso: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return null
  const y = Number(match[1])
  const m = Number(match[2])
  const d = Number(match[3])
  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  return { y, m, d }
}

/** Add whole months to an ISO date, clamping the day to the target month's length. */
export function addMonths(iso: string, months: number): string | null {
  const parts = parseIsoDate(iso)
  if (!parts) return null
  const firstOfTarget = new Date(Date.UTC(parts.y, parts.m - 1 + months, 1))
  const lastDay = new Date(
    Date.UTC(firstOfTarget.getUTCFullYear(), firstOfTarget.getUTCMonth() + 1, 0),
  ).getUTCDate()
  firstOfTarget.setUTCDate(Math.min(parts.d, lastDay))
  return firstOfTarget.toISOString().slice(0, 10)
}

function wholeDaysBetween(fromIso: string, toIso: string): number | null {
  const a = parseIsoDate(fromIso)
  const b = parseIsoDate(toIso)
  if (!a || !b) return null
  const from = Date.UTC(a.y, a.m - 1, a.d)
  const to = Date.UTC(b.y, b.m - 1, b.d)
  return Math.round((to - from) / MS_PER_DAY)
}

type Severity = 0 | 1 | 2

function severity(remaining: number, threshold: number): Severity {
  if (remaining < 0) return 2
  if (remaining <= threshold) return 1
  return 0
}

const STATUS_BY_SEVERITY: Record<Severity, ReminderStatusValue> = { 0: 'ok', 1: 'due', 2: 'overdue' }

export function computeReminderStatus(input: ReminderStatusInput): ReminderStatusResult {
  const dueMileage =
    input.intervalMiles != null && input.intervalMiles > 0 && input.lastCompletedMileage != null
      ? input.lastCompletedMileage + input.intervalMiles
      : null

  const milesRemaining =
    dueMileage != null && input.currentMileage != null ? dueMileage - input.currentMileage : null

  const dueDate =
    input.intervalMonths != null && input.intervalMonths > 0 && input.lastCompletedOn != null
      ? addMonths(input.lastCompletedOn, input.intervalMonths)
      : null

  const daysRemaining = dueDate != null ? wholeDaysBetween(input.today, dueDate) : null

  const severities: Severity[] = []
  if (milesRemaining != null) severities.push(severity(milesRemaining, DUE_SOON_MILES))
  if (daysRemaining != null) severities.push(severity(daysRemaining, DUE_SOON_DAYS))

  const worst = severities.reduce<Severity>((max, s) => (s > max ? s : max), 0)

  return {
    status: STATUS_BY_SEVERITY[worst],
    milesRemaining,
    daysRemaining,
    dueMileage,
    dueDate,
  }
}

/** `YYYY-MM-DD` for the local "today". */
export function todayIso(now: Date = new Date()): string {
  const y = String(now.getFullYear()).padStart(4, '0')
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
