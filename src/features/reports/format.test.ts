import { pdfDownloadUrl } from './api'
import { pdfState, reportDate, reportStatusLabel } from './format'

describe('report formatting', () => {
  it('formats the generation date', () => {
    expect(reportDate('2026-09-08T12:00:00.000Z')).toBe('Sep 8, 2026')
  })

  it('describes a report row by status and pdf state', () => {
    expect(reportStatusLabel({ status: 'revoked', pdfStatus: 'ready' })).toBe('Revoked')
    expect(reportStatusLabel({ status: 'active', pdfStatus: 'ready' })).toBe('Link active · PDF ready')
    expect(reportStatusLabel({ status: 'active', pdfStatus: 'pending' })).toBe(
      'Link active · preparing PDF',
    )
    expect(reportStatusLabel({ status: 'active', pdfStatus: 'failed' })).toBe(
      'Link active · PDF unavailable',
    )
  })

  it('collapses pdfStatus to the three states the flow cares about', () => {
    expect(pdfState('ready')).toBe('ready')
    expect(pdfState('failed')).toBe('failed')
    expect(pdfState('pending')).toBe('pending')
    expect(pdfState('unavailable')).toBe('pending')
  })
})

describe('pdfDownloadUrl', () => {
  it('points at the API public pdf route', () => {
    expect(pdfDownloadUrl('n_e91X4mmAnEUF0-HnzwYw')).toBe(
      'http://localhost:3000/v1/r/n_e91X4mmAnEUF0-HnzwYw/pdf',
    )
  })
})
