import { defaultMileageUnit } from './mileage-unit'

function mockLocale(locale: string): jest.SpyInstance {
  return jest.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
    resolvedOptions: () => ({ locale }),
  } as unknown as Intl.DateTimeFormat)
}

describe('defaultMileageUnit', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('defaults to mi for the US', () => {
    mockLocale('en-US')
    expect(defaultMileageUnit()).toBe('mi')
  })

  it('defaults to mi for the UK, which stayed on miles for roads', () => {
    mockLocale('en-GB')
    expect(defaultMileageUnit()).toBe('mi')
  })

  it('defaults to km everywhere else', () => {
    mockLocale('de-DE')
    expect(defaultMileageUnit()).toBe('km')
    mockLocale('fr-FR')
    expect(defaultMileageUnit()).toBe('km')
    mockLocale('ja-JP')
    expect(defaultMileageUnit()).toBe('km')
  })

  it('falls back to mi if the locale cannot be read', () => {
    jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('no ICU')
    })
    expect(defaultMileageUnit()).toBe('mi')
  })
})
