/**
 * The reminder-status parity table (Sprint 4 exit criterion — "client-side status
 * calc matches the API's").
 *
 * This exact array is duplicated at
 * `revv-api/test/fixtures/reminder-status-cases.ts`. When you touch one, touch the
 * other — `computeReminderStatus` here and its mirror there must agree on every row.
 */

import type { ReminderStatusInput, ReminderStatusResult } from './status'

export interface ReminderStatusCase {
  readonly name: string
  readonly input: ReminderStatusInput
  readonly expected: ReminderStatusResult
}

export const REMINDER_STATUS_CASES: readonly ReminderStatusCase[] = [
  {
    name: 'mile track, comfortably ahead → ok',
    input: {
      intervalMiles: 5_000,
      intervalMonths: null,
      lastCompletedOn: null,
      lastCompletedMileage: 41_200,
      currentMileage: 43_000,
      today: '2026-09-08',
    },
    expected: {
      status: 'ok',
      milesRemaining: 3_200,
      daysRemaining: null,
      dueMileage: 46_200,
      dueDate: null,
    },
  },
  {
    name: 'mile track, within 500 mi → due',
    input: {
      intervalMiles: 5_000,
      intervalMonths: null,
      lastCompletedOn: null,
      lastCompletedMileage: 41_200,
      currentMileage: 45_800,
      today: '2026-09-08',
    },
    expected: {
      status: 'due',
      milesRemaining: 400,
      daysRemaining: null,
      dueMileage: 46_200,
      dueDate: null,
    },
  },
  {
    name: 'mile track, past due → overdue (the demo: 41,200 + 5,000, now at 46,300)',
    input: {
      intervalMiles: 5_000,
      intervalMonths: null,
      lastCompletedOn: null,
      lastCompletedMileage: 41_200,
      currentMileage: 46_300,
      today: '2026-09-08',
    },
    expected: {
      status: 'overdue',
      milesRemaining: -100,
      daysRemaining: null,
      dueMileage: 46_200,
      dueDate: null,
    },
  },
  {
    name: 'time track, months out → ok',
    input: {
      intervalMiles: null,
      intervalMonths: 6,
      lastCompletedOn: '2026-06-01',
      lastCompletedMileage: null,
      currentMileage: 50_000,
      today: '2026-09-08',
    },
    expected: {
      status: 'ok',
      milesRemaining: null,
      daysRemaining: 84,
      dueMileage: null,
      dueDate: '2026-12-01',
    },
  },
  {
    name: 'time track, inside 14 days → due',
    input: {
      intervalMiles: null,
      intervalMonths: 6,
      lastCompletedOn: '2026-06-01',
      lastCompletedMileage: null,
      currentMileage: null,
      today: '2026-11-20',
    },
    expected: {
      status: 'due',
      milesRemaining: null,
      daysRemaining: 11,
      dueMileage: null,
      dueDate: '2026-12-01',
    },
  },
  {
    name: 'time track, past due → overdue',
    input: {
      intervalMiles: null,
      intervalMonths: 3,
      lastCompletedOn: '2026-01-31',
      lastCompletedMileage: null,
      currentMileage: null,
      today: '2026-09-08',
    },
    expected: {
      status: 'overdue',
      milesRemaining: null,
      daysRemaining: -131,
      dueMileage: null,
      // Jan 31 + 3 months clamps to Apr 30 (April has 30 days).
      dueDate: '2026-04-30',
    },
  },
  {
    name: 'both tracks — the sooner (time, overdue) wins',
    input: {
      intervalMiles: 10_000,
      intervalMonths: 12,
      lastCompletedOn: '2025-01-01',
      lastCompletedMileage: 40_000,
      currentMileage: 44_000,
      today: '2026-09-08',
    },
    expected: {
      status: 'overdue',
      milesRemaining: 6_000,
      daysRemaining: -250,
      dueMileage: 50_000,
      dueDate: '2026-01-01',
    },
  },
  {
    name: 'both tracks — both healthy → ok',
    input: {
      intervalMiles: 10_000,
      intervalMonths: 12,
      lastCompletedOn: '2026-06-01',
      lastCompletedMileage: 40_000,
      currentMileage: 42_000,
      today: '2026-09-08',
    },
    expected: {
      status: 'ok',
      milesRemaining: 8_000,
      daysRemaining: 266,
      dueMileage: 50_000,
      dueDate: '2027-06-01',
    },
  },
  {
    name: 'never completed, no vehicle mileage → nothing to compute → ok',
    input: {
      intervalMiles: 5_000,
      intervalMonths: null,
      lastCompletedOn: null,
      lastCompletedMileage: null,
      currentMileage: null,
      today: '2026-09-08',
    },
    expected: {
      status: 'ok',
      milesRemaining: null,
      daysRemaining: null,
      dueMileage: null,
      dueDate: null,
    },
  },
  {
    name: 'just completed at current mileage → resets to a full interval → ok',
    input: {
      intervalMiles: 5_000,
      intervalMonths: null,
      lastCompletedOn: '2026-09-08',
      lastCompletedMileage: 46_300,
      currentMileage: 46_300,
      today: '2026-09-08',
    },
    expected: {
      status: 'ok',
      milesRemaining: 5_000,
      daysRemaining: null,
      dueMileage: 51_300,
      dueDate: null,
    },
  },
]
