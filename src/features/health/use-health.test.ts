import { toHealthSnapshot } from './health-snapshot'

describe('toHealthSnapshot', () => {
  it('maps an ok response to loaded with the payload', () => {
    const snap = toHealthSnapshot({
      data: { status: 'ok', version: '0.1.0', time: '2026-01-01T00:00:00Z' },
    })

    expect(snap).toEqual({
      phase: 'loaded',
      status: 'ok',
      version: '0.1.0',
      time: '2026-01-01T00:00:00Z',
    })
  })

  it('maps a non-ok status to degraded', () => {
    const snap = toHealthSnapshot({ data: { status: 'starting', version: '0.1.0', time: 't' } })

    expect(snap.phase).toBe('degraded')
  })

  it('maps a client error to the error phase', () => {
    const snap = toHealthSnapshot({ error: { message: 'network down' } })

    expect(snap).toEqual({ phase: 'error', message: 'The api could not be reached.' })
  })

  it('maps a malformed body (missing fields) to the error phase', () => {
    const snap = toHealthSnapshot({ data: { status: 'ok' } })

    expect(snap.phase).toBe('error')
  })
})
