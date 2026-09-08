import { entrySubtitle, formatCost, formatDate, formatMileage, serviceTypeLabel } from './format'

describe('service-record formatting', () => {
  it('groups a mileage reading', () => {
    expect(formatMileage(41_250)).toBe('41,250')
    expect(formatMileage(null)).toBe('—')
  })

  it('formats cost from integer minor units', () => {
    expect(formatCost(4599, 'USD')).toBe('$45.99')
    expect(formatCost(null, 'USD')).toBeNull()
  })

  it('formats an ISO date without a timezone shift', () => {
    expect(formatDate('2026-01-15')).toBe('Jan 15, 2026')
  })

  it('labels a service type, falling back to the humanised key', () => {
    const types = [{ key: 'oil_change', label: 'Oil change' }]
    expect(serviceTypeLabel('oil_change', types)).toBe('Oil change')
    expect(serviceTypeLabel('brake_fluid', types)).toBe('brake fluid')
  })

  it('builds the entry subtitle', () => {
    expect(entrySubtitle({ shopName: "Mike's Auto", performedOn: '2026-01-15' })).toBe(
      "Mike's Auto · Jan 15, 2026",
    )
    expect(entrySubtitle({ shopName: null, performedOn: '2026-01-15' })).toBe('Jan 15, 2026')
  })
})
