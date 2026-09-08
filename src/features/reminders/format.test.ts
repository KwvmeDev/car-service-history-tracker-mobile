import { intervalLabel, nextDueLabel, remainingLabel } from './format'

describe('reminder formatting', () => {
  it('describes the interval', () => {
    expect(intervalLabel({ intervalMiles: 5_000, intervalMonths: null })).toBe('Every 5,000 mi')
    expect(intervalLabel({ intervalMiles: null, intervalMonths: 6 })).toBe('Every 6 mo')
    expect(intervalLabel({ intervalMiles: 5_000, intervalMonths: 6 })).toBe('Every 5,000 mi or 6 mo')
  })

  it('phrases the remaining headroom, taking the nearer track', () => {
    expect(remainingLabel({ milesRemaining: 320, daysRemaining: null })).toBe('Due in 320 mi')
    expect(remainingLabel({ milesRemaining: -1_200, daysRemaining: null })).toBe(
      'Overdue by 1,200 mi',
    )
    expect(remainingLabel({ milesRemaining: 4_000, daysRemaining: 9 })).toBe('Due in 9 days')
    expect(remainingLabel({ milesRemaining: null, daysRemaining: 1 })).toBe('Due in 1 day')
    expect(remainingLabel({ milesRemaining: null, daysRemaining: null })).toBe('On track')
  })

  it('states what a completion resets the clock to', () => {
    expect(nextDueLabel({ dueMileage: 51_300, dueDate: null })).toBe('Next at 51,300 mi')
    expect(nextDueLabel({ dueMileage: null, dueDate: '2027-06-01' })).toBe('Next on Jun 1, 2027')
    expect(nextDueLabel({ dueMileage: null, dueDate: null })).toBeNull()
  })
})
