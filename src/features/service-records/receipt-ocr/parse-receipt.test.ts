import { parseReceipt, proposedFields } from './parse-receipt'

const TODAY = '2026-09-09'
const parse = (text: string) => parseReceipt(text, { today: TODAY })

describe('parseReceipt — a well-formed shop receipt', () => {
  const receipt = [
    "Mike's Auto Service",
    '1420 Oak Avenue, Suite 3',
    'Springfield, IL 62704',
    '(217) 555-0142',
    '',
    'INVOICE #4471',
    'Service Date: 03/14/2026',
    'Odometer: 84,210 mi',
    '',
    'Synthetic oil change        45.00',
    'Oil filter                  12.99',
    'Shop supplies                4.50',
    'Subtotal                    62.49',
    'Sales tax                    5.31',
    'TOTAL DUE                  $67.80',
    '',
    'Thank you for your business!',
  ].join('\n')

  it('pulls the total, not the subtotal', () => {
    expect(parse(receipt).costMinor).toEqual({ value: 6780, confidence: 'high' })
  })

  it('infers USD from the $ symbol', () => {
    expect(parse(receipt).currency).toBe('USD')
  })

  it('reads the hinted service date, month-first', () => {
    expect(parse(receipt).performedOn).toEqual({ value: '2026-03-14', confidence: 'high' })
  })

  it('takes the business name from the first line', () => {
    expect(parse(receipt).shopName).toEqual({ value: "Mike's Auto Service", confidence: 'high' })
  })

  it('reads the odometer next to its label', () => {
    expect(parse(receipt).odometer).toEqual({ value: 84210, confidence: 'high' })
  })
})

describe('parseReceipt — currencies and dates', () => {
  it('reads a £ total as GBP', () => {
    const r = parse('Kwik Fit\nTotal  £129.99')
    expect(r.costMinor?.value).toBe(12999)
    expect(r.currency).toBe('GBP')
  })

  it('reads an explicit ISO 4217 code', () => {
    const r = parse('Canadian Tire\nAmount due 88.40 CAD')
    expect(r.currency).toBe('CAD')
  })

  it('normalises a written month', () => {
    const r = parse('Date: Jan 5, 2026\nTotal $20.00')
    expect(r.performedOn).toEqual({ value: '2026-01-05', confidence: 'high' })
  })

  it('normalises a "5 JAN 26" style date', () => {
    const r = parse('service date 5 JAN 26\nTotal $20.00')
    expect(r.performedOn?.value).toBe('2026-01-05')
  })

  it('swaps an unambiguous day-first date', () => {
    const r = parse('Date 25/12/2025\nTotal $10.00')
    expect(r.performedOn?.value).toBe('2025-12-25')
  })

  it('flags an ambiguous DD/MM vs MM/DD date as low confidence', () => {
    const r = parse('Date 04/05/2026\nTotal $10.00')
    expect(r.performedOn).toEqual({ value: '2026-04-05', confidence: 'low' })
  })

  it('rejects a date more than 30 days in the future', () => {
    const r = parse('Date 01/01/2099\nTotal $10.00')
    expect(r.performedOn).toBeNull()
  })
})

describe('parseReceipt — messy input', () => {
  it('falls back to the largest amount when there is no total hint, low confidence', () => {
    const r = parse('QUICK LUBE\n19.99\n5.00\n41.25\n')
    expect(r.costMinor).toEqual({ value: 4125, confidence: 'low' })
  })

  it('ignores bare integers with no decimals or currency marker', () => {
    const r = parse('Bay 3\nTicket 88213\nQty 2\nTotal $30.00')
    expect(r.costMinor?.value).toBe(3000)
  })

  it('skips an address / phone line for the shop name', () => {
    const r = parse('123 Main St\n(555) 555-5555\nDowntown Garage\nTotal $50.00')
    expect(r.shopName).toEqual({ value: 'Downtown Garage', confidence: 'low' })
  })

  it('returns an empty extraction for blank text', () => {
    expect(parse('   \n  \n')).toEqual({
      costMinor: null,
      currency: null,
      performedOn: null,
      shopName: null,
      odometer: null,
    })
  })

  it('reports which fields it proposed', () => {
    const r = parse("Joe's Tire\nDate 06/01/2026\nTotal $80.00")
    expect(proposedFields(r)).toEqual({ cost: true, date: true, shop: true, odometer: false })
  })
})
