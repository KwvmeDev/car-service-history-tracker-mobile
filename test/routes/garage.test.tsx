import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react-native'

import * as vehicleApi from '@/features/vehicles/api'
import type { VehicleListItem } from '@/features/vehicles/types'

import GarageScreen from '../../app/garage'

jest.mock('@/features/vehicles/api')
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}))
jest.mock('@/features/auth/use-session', () => ({
  useSignOut: () => jest.fn(),
}))

const mockApi = jest.mocked(vehicleApi)

function wrap(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

const item = (over: Partial<VehicleListItem> = {}): VehicleListItem => ({
  id: 'v1',
  vin: '1HGCM82633A004352',
  year: 2003,
  make: 'Honda',
  model: 'Accord',
  trim: 'EX',
  nickname: null,
  currentMileage: 41200,
  mileageUnit: 'mi',
  photoUrl: null,
  ownedSince: null,
  vinDecode: null,
  createdAt: '2026-09-07T00:00:00.000Z',
  updatedAt: '2026-09-07T00:00:00.000Z',
  ...over,
})

describe('GarageScreen — four states', () => {
  it('shows the loading skeleton', () => {
    mockApi.listVehicles.mockReturnValue(new Promise(() => undefined))
    wrap(<GarageScreen />)
    // three skeleton cards render immediately; no vehicle text yet
    expect(screen.queryByText('2003 Honda Accord')).toBeNull()
  })

  it('shows the designed empty state, not "No items yet"', async () => {
    mockApi.listVehicles.mockResolvedValue([])
    wrap(<GarageScreen />)
    await waitFor(() => {
      expect(screen.getByText('Your garage is empty')).toBeOnTheScreen()
    })
    expect(screen.getByText('Add a vehicle')).toBeOnTheScreen()
  })

  it('shows an inline error with a retry', async () => {
    mockApi.listVehicles.mockRejectedValue(Object.assign(new Error('down'), { status: 500 }))
    wrap(<GarageScreen />)
    await waitFor(() => {
      expect(screen.getByText('Try again')).toBeOnTheScreen()
    })
  })

  it('renders vehicle cards when loaded', async () => {
    mockApi.listVehicles.mockResolvedValue([item(), item({ id: 'v2', nickname: 'The wagon' })])
    wrap(<GarageScreen />)
    await waitFor(() => {
      expect(screen.getByText('2003 Honda Accord')).toBeOnTheScreen()
    })
    expect(screen.getByText('The wagon')).toBeOnTheScreen()
  })
})
