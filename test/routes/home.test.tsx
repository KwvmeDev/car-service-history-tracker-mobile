import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'

import * as reminderApi from '@/features/reminders/api'
import * as vehicleApi from '@/features/vehicles/api'
import type { Reminder } from '@/features/reminders/types'
import type { VehicleListItem } from '@/features/vehicles/types'

import HomeScreen from '../../app/(tabs)/home'

const mockUseSession = jest.fn()

jest.mock('@/features/vehicles/api')
jest.mock('@/features/reminders/api')
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }) }))
jest.mock('@/features/auth/auth-client', () => ({ authClient: { useSession: () => mockUseSession() } }))

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

beforeEach(() => {
  mockUseSession.mockReturnValue({
    data: { user: { id: 'u1', name: 'Kay Owusu', email: 'kay@example.test', emailVerified: true } },
  })
})

describe('HomeScreen', () => {
  it('greets the user by first name', async () => {
    mockVehicleApi.listVehicles.mockResolvedValue([vehicle()])
    mockReminderApi.listReminders.mockResolvedValue([])
    wrap(<HomeScreen />)
    await waitFor(() => {
      expect(screen.getByText('Hello, Kay')).toBeOnTheScreen()
    })
  })

  it('shows the designed empty state when the garage is empty', async () => {
    mockVehicleApi.listVehicles.mockResolvedValue([])
    wrap(<HomeScreen />)
    await waitFor(() => {
      expect(screen.getByText('Your garage is empty')).toBeOnTheScreen()
    })
  })

  it('shows the all-caught-up message when nothing is due', async () => {
    mockVehicleApi.listVehicles.mockResolvedValue([vehicle()])
    mockReminderApi.listReminders.mockResolvedValue([reminder({ status: 'ok' })])
    wrap(<HomeScreen />)
    await waitFor(() => {
      expect(screen.getByText(/all caught up/)).toBeOnTheScreen()
    })
  })

  it('summarises overdue and due-soon reminders across vehicles', async () => {
    mockVehicleApi.listVehicles.mockResolvedValue([vehicle(), vehicle({ id: 'v2', nickname: 'The wagon' })])
    mockReminderApi.listReminders.mockImplementation((vehicleId: string) =>
      Promise.resolve(
        vehicleId === 'v1'
          ? [reminder({ id: 'r1', status: 'overdue' })]
          : [reminder({ id: 'r2', status: 'due' })],
      ),
    )
    wrap(<HomeScreen />)
    await waitFor(() => {
      expect(screen.getByText('1 overdue')).toBeOnTheScreen()
    })
    expect(screen.getByText('1 due soon')).toBeOnTheScreen()
  })

  it('filters the vehicle list by search query', async () => {
    mockVehicleApi.listVehicles.mockResolvedValue([vehicle(), vehicle({ id: 'v2', nickname: 'The wagon' })])
    mockReminderApi.listReminders.mockResolvedValue([])
    wrap(<HomeScreen />)
    await waitFor(() => {
      expect(screen.getByText('2003 Honda Accord')).toBeOnTheScreen()
    })
    fireEvent.changeText(screen.getByPlaceholderText('Find your vehicle'), 'wagon')
    await waitFor(() => {
      expect(screen.queryByText('2003 Honda Accord')).toBeNull()
    })
    expect(screen.getByText('The wagon')).toBeOnTheScreen()
  })
})
