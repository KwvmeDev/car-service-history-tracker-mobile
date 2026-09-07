import { shouldRetry } from './query-client'

describe('shouldRetry', () => {
  it('does not retry a 4xx the request itself caused', () => {
    for (const status of [400, 401, 403, 404, 409, 422]) {
      expect(shouldRetry(0, { status })).toBe(false)
    }
  })

  it('retries a 5xx / network error up to three attempts', () => {
    expect(shouldRetry(0, { status: 500 })).toBe(true)
    expect(shouldRetry(2, new Error('network'))).toBe(true)
    expect(shouldRetry(3, { status: 503 })).toBe(false)
  })
})
