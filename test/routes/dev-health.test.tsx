import { render, screen } from '@testing-library/react-native'

import { api } from '@/api/client'

import HealthScreen from '../../app/dev-health'

// The api wrapper is the seam. The screen's four states are driven entirely by what
// api.GET resolves/rejects with (docs/testing-strategy.md — test the states, not fetch).
jest.mock('@/api/client', () => ({
  api: { GET: jest.fn() },
}))

const mockGet = api.GET as jest.Mock

describe('HealthScreen', () => {
  it('shows the loading state, then the loaded api status in the data font', async () => {
    mockGet.mockResolvedValue({
      data: { status: 'ok', version: '1.2.3', time: '2026-01-01T00:00:00Z' },
    })

    render(<HealthScreen />)

    expect(screen.getByText('Checking the api')).toBeTruthy()

    expect(await screen.findByText('1.2.3')).toBeTruthy()
    expect(screen.getByText('ok')).toBeTruthy()
  })

  it('renders an inline error with a retry affordance when the api cannot be reached', async () => {
    mockGet.mockRejectedValue(new Error('offline'))

    render(<HealthScreen />)

    expect(await screen.findByText('The api could not be reached.')).toBeTruthy()
    expect(screen.getByText('retry')).toBeTruthy()
  })
})
