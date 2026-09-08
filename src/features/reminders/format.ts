import type { Reminder } from './types'

const groupInt = (n: number): string => Math.abs(n).toLocaleString('en-US')

/** "Every 5,000 mi", "Every 6 mo", "Every 5,000 mi or 6 mo". */
export function intervalLabel(
  reminder: Pick<Reminder, 'intervalMiles' | 'intervalMonths'>,
): string {
  const parts: string[] = []
  if (reminder.intervalMiles != null) parts.push(`${groupInt(reminder.intervalMiles)} mi`)
  if (reminder.intervalMonths != null) {
    parts.push(`${String(reminder.intervalMonths)} mo`)
  }
  return parts.length > 0 ? `Every ${parts.join(' or ')}` : 'No interval set'
}

/**
 * The urgency line under a reminder: the nearer of the two tracks, phrased for the
 * status. "Due in 320 mi" / "Overdue by 1,200 mi" / "Due in 9 days" / "On track".
 */
export function remainingLabel(
  reminder: Pick<Reminder, 'milesRemaining' | 'daysRemaining'>,
): string {
  const { milesRemaining, daysRemaining } = reminder

  // Pick the track with the least headroom. Miles and days aren't the same unit,
  // but for one line of copy we take whichever is more urgent by sign/size.
  const candidates: { kind: 'mi' | 'day'; value: number }[] = []
  if (milesRemaining != null) candidates.push({ kind: 'mi', value: milesRemaining })
  if (daysRemaining != null) candidates.push({ kind: 'day', value: daysRemaining })
  if (candidates.length === 0) return 'On track'

  const worst = candidates.reduce((a, b) => (b.value < a.value ? b : a))
  const noun =
    worst.kind === 'mi' ? 'mi' : Math.abs(worst.value) === 1 ? 'day' : 'days'

  return worst.value < 0
    ? `Overdue by ${groupInt(worst.value)} ${noun}`
    : `Due in ${groupInt(worst.value)} ${noun}`
}

/** "Next: 51,300 mi" / "Next: 1 Jun 2027" — what a completion resets the clock to. */
export function nextDueLabel(
  reminder: Pick<Reminder, 'dueMileage' | 'dueDate'>,
): string | null {
  if (reminder.dueMileage != null) return `Next at ${groupInt(reminder.dueMileage)} mi`
  if (reminder.dueDate != null) {
    const [y, m, d] = reminder.dueDate.split('-').map(Number)
    if (y && m && d) {
      return `Next on ${new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })}`
    }
  }
  return null
}
