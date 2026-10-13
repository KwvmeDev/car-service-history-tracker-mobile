/**
 * The reminder-status parity table (Sprint 4 exit criterion — "client-side status
 * calc matches the API's").
 *
 * This exact array is duplicated at
 * `revv-api/test/fixtures/reminder-status-cases.ts`. When you touch one, touch the
 * other — `computeReminderStatus` here and its mirror there must agree on every row.
 */

import type { PushDueKind, ReminderStatusInput, ReminderStatusResult } from './status'

export interface ReminderStatusCase {
  readonly name: string
  readonly input: ReminderStatusInput
  readonly expected: ReminderStatusResult
}

export interface PushDueKindCase {
  readonly name: string
  readonly input: ReminderStatusInput
  readonly expected: PushDueKind | null
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
      mileageUnit: 'mi',
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
      mileageUnit: 'mi',
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
      mileageUnit: 'mi',
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
      mileageUnit: 'mi',
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
      mileageUnit: 'mi',
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
      mileageUnit: 'mi',
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
      mileageUnit: 'mi',
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
      mileageUnit: 'mi',
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
      mileageUnit: 'mi',
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
      mileageUnit: 'mi',
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
  {
    name: 'km vehicle, 750 km remaining → due (805 km threshold, not the 500 mi one)',
    input: {
      intervalMiles: 5_000,
      intervalMonths: null,
      lastCompletedOn: null,
      lastCompletedMileage: 40_000,
      currentMileage: 44_250,
      mileageUnit: 'km',
      today: '2026-09-08',
    },
    expected: {
      status: 'due',
      milesRemaining: 750,
      daysRemaining: null,
      dueMileage: 45_000,
      dueDate: null,
    },
  },
  {
    name: 'km vehicle, 900 km remaining → ok (beyond the scaled 805 km threshold)',
    input: {
      intervalMiles: 5_000,
      intervalMonths: null,
      lastCompletedOn: null,
      lastCompletedMileage: 40_000,
      currentMileage: 44_100,
      mileageUnit: 'km',
      today: '2026-09-08',
    },
    expected: {
      status: 'ok',
      milesRemaining: 900,
      daysRemaining: null,
      dueMileage: 45_000,
      dueDate: null,
    },
  },
]

/**
 * `pushDueKind` parity table (Sprint 8). Also duplicated byte-for-byte in
 * `revv-mobile/src/features/reminders/status.fixtures.ts`. Exercises the
 * `upcoming` boundary (1,000 mi / 30 days) that `computeReminderStatus` does not
 * model.
 */
export const PUSH_DUE_KIND_CASES: readonly PushDueKindCase[] = [
  {
    name: 'mile track, exactly 1,000 mi out → upcoming',
    input: {
      intervalMiles: 5_000,
      intervalMonths: null,
      lastCompletedOn: null,
      lastCompletedMileage: 40_000,
      currentMileage: 44_000,
      mileageUnit: 'mi',
      today: '2026-09-08',
    },
    expected: 'upcoming',
  },
  {
    name: 'mile track, 1,001 mi out → not yet push-worthy',
    input: {
      intervalMiles: 5_000,
      intervalMonths: null,
      lastCompletedOn: null,
      lastCompletedMileage: 40_000,
      currentMileage: 43_999,
      mileageUnit: 'mi',
      today: '2026-09-08',
    },
    expected: null,
  },
  {
    name: 'mile track, within 500 mi → due (not upcoming)',
    input: {
      intervalMiles: 5_000,
      intervalMonths: null,
      lastCompletedOn: null,
      lastCompletedMileage: 40_000,
      currentMileage: 44_500,
      mileageUnit: 'mi',
      today: '2026-09-08',
    },
    expected: 'due',
  },
  {
    name: 'mile track, past due → overdue',
    input: {
      intervalMiles: 5_000,
      intervalMonths: null,
      lastCompletedOn: null,
      lastCompletedMileage: 40_000,
      currentMileage: 45_001,
      mileageUnit: 'mi',
      today: '2026-09-08',
    },
    expected: 'overdue',
  },
  {
    name: 'month track, exactly 30 days out → upcoming',
    input: {
      intervalMiles: null,
      intervalMonths: 6,
      lastCompletedOn: '2026-06-01',
      lastCompletedMileage: null,
      currentMileage: null,
      mileageUnit: 'mi',
      today: '2026-11-01',
    },
    expected: 'upcoming',
  },
  {
    name: 'month track, 31 days out → not yet push-worthy',
    input: {
      intervalMiles: null,
      intervalMonths: 6,
      lastCompletedOn: '2026-06-01',
      lastCompletedMileage: null,
      currentMileage: null,
      mileageUnit: 'mi',
      today: '2026-10-31',
    },
    expected: null,
  },
  {
    name: 'month track, 14 days out → due',
    input: {
      intervalMiles: null,
      intervalMonths: 6,
      lastCompletedOn: '2026-06-01',
      lastCompletedMileage: null,
      currentMileage: null,
      mileageUnit: 'mi',
      today: '2026-11-17',
    },
    expected: 'due',
  },
  {
    name: 'both tracks — miles upcoming, time overdue → overdue (nearer wins)',
    input: {
      intervalMiles: 5_000,
      intervalMonths: 3,
      lastCompletedOn: '2026-01-31',
      lastCompletedMileage: 40_000,
      currentMileage: 44_100,
      mileageUnit: 'mi',
      today: '2026-09-08',
    },
    expected: 'overdue',
  },
  {
    name: 'comfortably ahead on both → null',
    input: {
      intervalMiles: 5_000,
      intervalMonths: 12,
      lastCompletedOn: '2026-06-01',
      lastCompletedMileage: 40_000,
      currentMileage: 42_000,
      mileageUnit: 'mi',
      today: '2026-09-08',
    },
    expected: null,
  },
  {
    name: 'no interval at all → null',
    input: {
      intervalMiles: null,
      intervalMonths: null,
      lastCompletedOn: null,
      lastCompletedMileage: null,
      currentMileage: 50_000,
      mileageUnit: 'mi',
      today: '2026-09-08',
    },
    expected: null,
  },
  {
    name: 'km vehicle, exactly 1,609 km out → upcoming (the 1,000 mi window, scaled)',
    input: {
      intervalMiles: 5_000,
      intervalMonths: null,
      lastCompletedOn: null,
      lastCompletedMileage: 40_000,
      currentMileage: 43_391,
      mileageUnit: 'km',
      today: '2026-09-08',
    },
    expected: 'upcoming',
  },
  {
    name: 'km vehicle, 1,610 km out → not yet push-worthy',
    input: {
      intervalMiles: 5_000,
      intervalMonths: null,
      lastCompletedOn: null,
      lastCompletedMileage: 40_000,
      currentMileage: 43_390,
      mileageUnit: 'km',
      today: '2026-09-08',
    },
    expected: null,
  },
  {
    name: 'km vehicle, within 805 km → due (not upcoming)',
    input: {
      intervalMiles: 5_000,
      intervalMonths: null,
      lastCompletedOn: null,
      lastCompletedMileage: 40_000,
      currentMileage: 44_250,
      mileageUnit: 'km',
      today: '2026-09-08',
    },
    expected: 'due',
  },
]
