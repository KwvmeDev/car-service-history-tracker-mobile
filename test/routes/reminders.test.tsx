import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react-native'

import * as reminderApi from '@/features/reminders/api'
import * as vehicleApi from '@/features/vehicles/api'
import type { Reminder } from '@/features/reminders/types'
import type { VehicleListItem } from '@/features/vehicles/types'

import RemindersScreen from '../../app/(tabs)/reminders'

jest.mock('@/features/vehicles/api')
jest.mock('@/features/reminders/api')
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }) }))

const mockVehicleApi = jest.mocked(vehicleApi)
const mockReminderApi = jest.mocked(reminderApi)

function wrap(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

const vehicle = (over: Partial<VehicleListItem> = {}): VehicleListItem => ({
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

const reminder = (over: Partial<Reminder> = {}): Reminder => ({
  id: 'r1',
  vehicleId: 'v1',
  title: 'Oil change',
  serviceTypeKey: null,
  intervalMiles: 5000,
  intervalMonths: null,
  lastCompletedOn: null,
  lastCompletedMileage: null,
  status: 'ok',
  milesRemaining: null,
  daysRemaining: null,
  dueMileage: null,
  dueDate: null,
  createdAt: '2026-09-07T00:00:00.000Z',
  updatedAt: '2026-09-07T00:00:00.000Z',
  ...over,
})

describe('RemindersScreen', () => {
  it('prompts to add a vehicle when the garage is empty', async () => {
    mockVehicleApi.listVehicles.mockResolvedValue([])
    wrap(<RemindersScreen />)
    await waitFor(() => {
      expect(screen.getByText('No vehicles yet')).toBeOnTheScreen()
    })
  })

  it('shows the all-caught-up state when no reminders are due', async () => {
    mockVehicleApi.listVehicles.mockResolvedValue([vehicle()])
    mockReminderApi.listReminders.mockResolvedValue([])
    wrap(<RemindersScreen />)
    await waitFor(() => {
      expect(screen.getByText('All caught up')).toBeOnTheScreen()
    })
  })

  it('groups reminders by status, naming each vehicle', async () => {
    mockVehicleApi.listVehicles.mockResolvedValue([vehicle(), vehicle({ id: 'v2', nickname: 'The wagon' })])
    mockReminderApi.listReminders.mockImplementation((vehicleId: string) =>
      Promise.resolve(
        vehicleId === 'v1'
          ? [reminder({ id: 'r1', title: 'Oil change', status: 'overdue', vehicleId: 'v1' })]
          : [reminder({ id: 'r2', title: 'Tire rotation', status: 'due', vehicleId: 'v2' })],
      ),
    )
    wrap(<RemindersScreen />)
    await waitFor(() => {
      expect(screen.getByText('Oil change')).toBeOnTheScreen()
    })
    // "Overdue"/"Due soon" appear twice each (the section label and the row's own
    // status badge) — assert presence, not uniqueness.
    expect(screen.getAllByText('Overdue').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Due soon').length).toBeGreaterThan(0)
    expect(screen.getByText('Tire rotation')).toBeOnTheScreen()
    expect(screen.getByText(/The wagon/)).toBeOnTheScreen()
  })
})
