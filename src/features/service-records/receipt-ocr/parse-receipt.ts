/**
 * Receipt parsing (Sprint 9) — a **pure function**, no I/O.
 *
 * ML Kit hands us the recognised text of a receipt photo; this pulls out the four
 * fields the log form wants: cost, currency, date, shop name, odometer. Every field
 * carries a confidence so the UI can show the low-confidence guesses more tentatively.
 * The user always confirms — nothing here auto-saves.
 *
 * Kept deliberately heuristic and testable: `parse-receipt.test.ts` runs a table of
 * real-shaped OCR dumps through it. Behaviour changes go through that table.
 */

export type FieldConfidence = 'high' | 'low'

export interface ExtractedField<T> {
  readonly value: T
  readonly confidence: FieldConfidence
}

export interface ReceiptExtraction {
  /** Integer minor units (cents). */
  readonly costMinor: ExtractedField<number> | null
  /** ISO 4217, inferred from a symbol or an explicit code. `null` when unknown. */
  readonly currency: string | null
  /** `YYYY-MM-DD`. */
  readonly performedOn: ExtractedField<string> | null
  readonly shopName: ExtractedField<string> | null
  readonly odometer: ExtractedField<number> | null
}

export const EMPTY_EXTRACTION: ReceiptExtraction = {
  costMinor: null,
  currency: null,
  performedOn: null,
  shopName: null,
  odometer: null,
}

const MONTHS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
]

const SYMBOL_CURRENCY: Record<string, string> = { $: 'USD', '£': 'GBP', '€': 'EUR' }
const KNOWN_CODES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'CHF']

const TOTAL_HINT = /\b(grand\s*total|amount\s*due|balance\s*due|total\s*due|invoice\s*total|total)\b/i
const NOT_TOTAL = /\b(sub\s*total|subtotal|total\s*tax|tax\s*total|total\s*savings|total\s*items?)\b/i
const DATE_HINT = /\b(date|invoice\s*date|service\s*date|sold|transaction|completed)\b/i
const ODO_HINT = /\b(odometer|mileage|odo\b|miles?\b|mi\s*(in|out)\b)\b/i

const lines = (text: string): string[] =>
  text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

// ── money ────────────────────────────────────────────────────────────────────

interface Money {
  amount: number
  currency: string | null
}

/** Every currency-looking amount on a line, with a currency guess. */
function moneyOnLine(line: string): Money[] {
  const out: Money[] = []
  const re = /([$£€])?\s?(\d{1,3}(?:,\d{3})+(?:\.\d{2})?|\d+\.\d{2}|\d+)\s?([A-Z]{3})?/g
  let m: RegExpExecArray | null
  while ((m = re.exec(line)) !== null) {
    const symbol = m[1]
    const raw = m[2]
    const code = m[3]
    if (!raw) continue
    // Ignore bare integers with no decimals and no currency marker — too noisy
    // (quantities, phone fragments, item codes).
    const hasDecimals = raw.includes('.')
    const hasMarker = symbol != null || (code != null && KNOWN_CODES.includes(code))
    if (!hasDecimals && !hasMarker) continue
    const amount = Number(raw.replace(/,/g, ''))
    if (!Number.isFinite(amount) || amount <= 0) continue
    const currency =
      code && KNOWN_CODES.includes(code) ? code : symbol ? (SYMBOL_CURRENCY[symbol] ?? null) : null
    out.push({ amount, currency })
  }
  return out
}

function extractCost(rows: string[]): {
  cost: ExtractedField<number> | null
  currency: string | null
} {
  const totalCandidates: Money[] = []
  const allMoney: Money[] = []

  for (const line of rows) {
    const money = moneyOnLine(line)
    if (money.length === 0) continue
    allMoney.push(...money)
    if (TOTAL_HINT.test(line) && !NOT_TOTAL.test(line)) {
      totalCandidates.push(...money)
    }
  }

  if (allMoney.length === 0) return { cost: null, currency: null }

  const currency =
    (totalCandidates.find((m) => m.currency)?.currency ??
      allMoney.find((m) => m.currency)?.currency) ??
    null

  if (totalCandidates.length > 0) {
    // A receipt often prints the total more than once — take the largest of the hinted ones.
    const best = totalCandidates.reduce((a, b) => (b.amount > a.amount ? b : a))
    return { cost: { value: Math.round(best.amount * 100), confidence: 'high' }, currency }
  }

  const largest = allMoney.reduce((a, b) => (b.amount > a.amount ? b : a))
  return { cost: { value: Math.round(largest.amount * 100), confidence: 'low' }, currency }
}

// ── date ─────────────────────────────────────────────────────────────────────

function iso(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  const yyyy = y < 100 ? 2000 + y : y
  if (yyyy < 2000 || yyyy > 2100) return null
  return `${String(yyyy).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** All dates found on a line, normalised to `YYYY-MM-DD`, with an ambiguity flag. */
function datesOnLine(line: string): { value: string; ambiguous: boolean }[] {
  const found: { value: string; ambiguous: boolean }[] = []

  for (const m of line.matchAll(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g)) {
    const v = iso(Number(m[1]), Number(m[2]), Number(m[3]))
    if (v) found.push({ value: v, ambiguous: false })
  }

  for (const m of line.matchAll(/\b(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})\b/g)) {
    let a = Number(m[1])
    let b = Number(m[2])
    const y = Number(m[3])
    let ambiguous = a <= 12 && b <= 12
    if (a > 12 && b <= 12) {
      ;[a, b] = [b, a] // clearly D/M — swap to M/D
      ambiguous = false
    }
    const v = iso(y, a, b) // assume month-first
    if (v) found.push({ value: v, ambiguous })
  }

  const mon = `(${MONTHS.join('|')})`
  for (const m of line.matchAll(new RegExp(`\\b${mon}[a-z]*\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{2,4})\\b`, 'gi'))) {
    const monthName = m[1]?.toLowerCase() ?? ''
    const v = iso(Number(m[3]), MONTHS.indexOf(monthName) + 1, Number(m[2]))
    if (v) found.push({ value: v, ambiguous: false })
  }
  for (const m of line.matchAll(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+${mon}[a-z]*\\.?,?\\s+(\\d{2,4})\\b`, 'gi'))) {
    const monthName = m[2]?.toLowerCase() ?? ''
    const v = iso(Number(m[3]), MONTHS.indexOf(monthName) + 1, Number(m[1]))
    if (v) found.push({ value: v, ambiguous: false })
  }

  return found
}

function extractDate(rows: string[], today: string): ExtractedField<string> | null {
  const hinted: { value: string; ambiguous: boolean }[] = []
  const plain: { value: string; ambiguous: boolean }[] = []

  for (const line of rows) {
    const hits = datesOnLine(line)
    if (hits.length === 0) continue
    ;(DATE_HINT.test(line) ? hinted : plain).push(...hits)
  }

  const soon = new Date(today)
  soon.setDate(soon.getDate() + 30)
  const cutoff = soon.toISOString().slice(0, 10)

  const usable = [...hinted, ...plain].filter((d) => d.value <= cutoff)
  if (usable.length === 0) return null

  const pick = usable[0]
  if (!pick) return null
  const wasHinted = hinted.some((h) => h.value === pick.value)
  return {
    value: pick.value,
    confidence: wasHinted && !pick.ambiguous ? 'high' : 'low',
  }
}

// ── shop name ────────────────────────────────────────────────────────────────

const ADDRESSY = /(\bstreet\b|\bst\b|\bave\b|\bavenue\b|\bblvd\b|\bboulevard\b|\broad\b|\brd\b|\bsuite\b|\bste\b|\bunit\b|\d{5}(-\d{4})?$)/i
const PHONE = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/
const CONTACT = /(https?:\/\/|www\.|@|\.com\b|\.net\b)/i
const DOCWORD = /\b(invoice|receipt|estimate|work\s*order|repair\s*order|customer\s*copy|tax\s*invoice)\b/i

function extractShopName(rows: string[]): ExtractedField<string> | null {
  const head = rows.slice(0, 5)
  for (let i = 0; i < head.length; i++) {
    const line = head[i]
    if (!line) continue
    if (PHONE.test(line) || CONTACT.test(line) || DOCWORD.test(line)) continue
    if (ADDRESSY.test(line) || /^\d/.test(line)) continue
    if (datesOnLine(line).length > 0) continue
    const letters = line.replace(/[^A-Za-z]/g, '')
    if (letters.length < 2) continue
    return { value: line, confidence: i === 0 ? 'high' : 'low' }
  }
  return null
}

// ── odometer ─────────────────────────────────────────────────────────────────

function extractOdometer(rows: string[]): ExtractedField<number> | null {
  for (const line of rows) {
    if (!ODO_HINT.test(line)) continue
    const m = /(\d{1,3}(?:,\d{3})+|\d{3,7})/.exec(line.replace(ODO_HINT, ' '))
    if (!m?.[1]) continue
    const n = Number(m[1].replace(/,/g, ''))
    if (Number.isFinite(n) && n >= 100 && n <= 2_000_000) {
      return { value: n, confidence: 'high' }
    }
  }
  // A number immediately followed by a unit.
  for (const line of rows) {
    const m = /(\d{1,3}(?:,\d{3})+|\d{3,7})\s?(mi|miles|km)\b/i.exec(line)
    if (!m?.[1]) continue
    const n = Number(m[1].replace(/,/g, ''))
    if (Number.isFinite(n) && n >= 100 && n <= 2_000_000) {
      return { value: n, confidence: 'low' }
    }
  }
  return null
}

// ── entry point ──────────────────────────────────────────────────────────────

export interface ParseReceiptOptions {
  /** Today as `YYYY-MM-DD` — used to reject a nonsense future date. Injected for tests. */
  readonly today: string
}

export function parseReceipt(text: string, options: ParseReceiptOptions): ReceiptExtraction {
  const rows = lines(text)
  if (rows.length === 0) return EMPTY_EXTRACTION

  const { cost, currency } = extractCost(rows)
  return {
    costMinor: cost,
    currency,
    performedOn: extractDate(rows, options.today),
    shopName: extractShopName(rows),
    odometer: extractOdometer(rows),
  }
}

/** Which fields the parser produced a value for — for the accuracy telemetry. */
export function proposedFields(extraction: ReceiptExtraction): {
  cost: boolean
  date: boolean
  shop: boolean
  odometer: boolean
} {
  return {
    cost: extraction.costMinor != null,
    date: extraction.performedOn != null,
    shop: extraction.shopName != null,
    odometer: extraction.odometer != null,
  }
}
