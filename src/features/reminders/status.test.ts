import {
  addMonths,
  computeReminderStatus,
  DUE_SOON_DAYS,
  DUE_SOON_KM,
  DUE_SOON_MILES,
  pushDueKind,
  UPCOMING_KM,
} from './status'
import { PUSH_DUE_KIND_CASES, REMINDER_STATUS_CASES } from './status.fixtures'

describe('computeReminderStatus — the shared parity table (matches revv-api)', () => {
  for (const { name, input, expected } of REMINDER_STATUS_CASES) {
    it(name, () => {
      expect(computeReminderStatus(input)).toEqual(expected)
    })
  }
})

describe('computeReminderStatus — thresholds', () => {
  const base = {
    intervalMiles: 5_000,
    intervalMonths: null,
    lastCompletedOn: null,
    lastCompletedMileage: 40_000,
    currentMileage: 40_000,
    mileageUnit: 'mi',
    today: '2026-09-08',
  } as const

  it('exactly at the mile threshold is "due"', () => {
    expect(computeReminderStatus({ ...base, currentMileage: 45_000 - DUE_SOON_MILES }).status).toBe(
      'due',
    )
  })

  it('exactly at due mileage is "due", one over is "overdue"', () => {
    expect(computeReminderStatus({ ...base, currentMileage: 45_000 }).status).toBe('due')
    expect(computeReminderStatus({ ...base, currentMileage: 45_001 }).status).toBe('overdue')
  })

  it('a zero interval is no track', () => {
    expect(computeReminderStatus({ ...base, intervalMiles: 0 }).milesRemaining).toBeNull()
  })

  it('the day threshold is 14', () => {
    const r = computeReminderStatus({
      intervalMiles: null,
      intervalMonths: 1,
      lastCompletedOn: '2026-09-08',
      lastCompletedMileage: null,
      currentMileage: null,
      mileageUnit: 'mi',
      today: '2026-09-24',
    })
    expect(r.daysRemaining).toBe(DUE_SOON_DAYS)
    expect(r.status).toBe('due')
  })
})

describe('computeReminderStatus — km thresholds are scaled, not reused raw', () => {
  const kmBase = {
    intervalMiles: 5_000,
    intervalMonths: null,
    lastCompletedOn: null,
    lastCompletedMileage: 40_000,
    mileageUnit: 'km',
    today: '2026-09-08',
  } as const

  it('exactly at the km threshold is "due", one km past it is "ok"', () => {
    expect(computeReminderStatus({ ...kmBase, currentMileage: 45_000 - DUE_SOON_KM }).status).toBe('due')
    expect(computeReminderStatus({ ...kmBase, currentMileage: 45_000 - DUE_SOON_KM - 1 }).status).toBe('ok')
  })
})

describe('pushDueKind — the shared parity table (matches revv-api)', () => {
  for (const { name, input, expected } of PUSH_DUE_KIND_CASES) {
    it(name, () => {
      expect(pushDueKind(input)).toBe(expected)
    })
  }
})

describe('pushDueKind — km thresholds are scaled, not reused raw', () => {
  const kmMileBase = {
    intervalMiles: 5_000,
    intervalMonths: null,
    lastCompletedOn: null,
    lastCompletedMileage: 40_000,
    mileageUnit: 'km',
    today: '2026-09-08',
  } as const

  it(`exactly ${String(UPCOMING_KM)} km out is "upcoming"; one more is null`, () => {
    expect(pushDueKind({ ...kmMileBase, currentMileage: 45_000 - UPCOMING_KM })).toBe('upcoming')
    expect(pushDueKind({ ...kmMileBase, currentMileage: 45_000 - UPCOMING_KM - 1 })).toBeNull()
  })
})

describe('addMonths', () => {
  it('clamps and rolls the year', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2026-11-15', 3)).toBe('2027-02-15')
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29')
  })
})
