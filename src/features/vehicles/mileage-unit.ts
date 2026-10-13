/**
 * A sensible starting guess for a new vehicle's mileage unit — the user can always
 * override it (MileageUnitToggle). Region, not language, decides the odometer unit,
 * so this reads the device locale's region subtag rather than asking every time.
 *
 * Miles-odometer countries are the exception, not the rule: the US, plus the UK,
 * Liberia and Myanmar, which stayed on miles for roads/vehicles despite going
 * metric everywhere else. Everyone else defaults to km.
 */
const MILES_REGIONS = new Set(['US', 'GB', 'LR', 'MM'])

function regionOf(locale: string): string | null {
  const match = /^[a-z]{2,3}(?:-[A-Za-z]{4})?-([A-Za-z]{2})(?:-|$)/.exec(locale)
  return match?.[1]?.toUpperCase() ?? null
}

export function defaultMileageUnit(): 'mi' | 'km' {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale
    const region = regionOf(locale)
    return region != null && MILES_REGIONS.has(region) ? 'mi' : 'km'
  } catch {
    return 'mi'
  }
}
