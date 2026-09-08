import * as Notifications from 'expo-notifications'

import * as pushApi from './api'
import { registerForPush, unregisterFromPush, watchPushTokenChanges } from './push-registration'

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  addPushTokenListener: jest.fn(() => ({ remove: jest.fn() })),
}))
jest.mock('./api')

const mockNotifications = jest.mocked(Notifications)
const mockApi = jest.mocked(pushApi)

const granted = { granted: true } as Notifications.NotificationPermissionsStatus
const denied = { granted: false } as Notifications.NotificationPermissionsStatus

beforeEach(() => {
  mockApi.registerPushToken.mockResolvedValue(undefined)
  mockApi.unregisterPushToken.mockResolvedValue(undefined)
})

describe('registerForPush', () => {
  it('registers the Expo token once permission is granted', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue(granted)
    mockNotifications.getExpoPushTokenAsync.mockResolvedValue({
      data: 'ExponentPushToken[abc]',
      type: 'expo',
    })

    await registerForPush()

    expect(mockApi.registerPushToken).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'ExponentPushToken[abc]' }),
    )
  })

  it('asks for permission when not yet granted', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue(denied)
    mockNotifications.requestPermissionsAsync.mockResolvedValue(granted)
    mockNotifications.getExpoPushTokenAsync.mockResolvedValue({
      data: 'ExponentPushToken[fresh]',
      type: 'expo',
    })

    await registerForPush()
    expect(mockNotifications.requestPermissionsAsync).toHaveBeenCalled()
    expect(mockApi.registerPushToken).toHaveBeenCalled()
  })

  it('does nothing when permission is denied', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue(denied)
    mockNotifications.requestPermissionsAsync.mockResolvedValue(denied)

    await registerForPush()
    expect(mockApi.registerPushToken).not.toHaveBeenCalled()
  })

  it('swallows a token-fetch failure', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue(granted)
    mockNotifications.getExpoPushTokenAsync.mockRejectedValue(new Error('no projectId'))

    await expect(registerForPush()).resolves.toBeUndefined()
    expect(mockApi.registerPushToken).not.toHaveBeenCalled()
  })
})

describe('unregisterFromPush', () => {
  it('deregisters the last-registered token and never throws on failure', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue(granted)
    mockNotifications.getExpoPushTokenAsync.mockResolvedValue({
      data: 'ExponentPushToken[gone]',
      type: 'expo',
    })
    await registerForPush()

    mockApi.unregisterPushToken.mockRejectedValueOnce(new Error('offline'))
    await expect(unregisterFromPush()).resolves.toBeUndefined()
    expect(mockApi.unregisterPushToken).toHaveBeenCalledWith('ExponentPushToken[gone]')

    // second call is a no-op — the stored token was cleared
    mockApi.unregisterPushToken.mockClear()
    await unregisterFromPush()
    expect(mockApi.unregisterPushToken).not.toHaveBeenCalled()
  })
})

describe('watchPushTokenChanges', () => {
  it('re-registers when the token rotates and subscribes/unsubscribes', () => {
    const remove = jest.fn()
    let listener: ((e: { data: string }) => void) | undefined
    mockNotifications.addPushTokenListener.mockImplementation((cb) => {
      listener = cb as (e: { data: string }) => void
      return { remove }
    })

    const unwatch = watchPushTokenChanges()
    listener?.({ data: 'ExponentPushToken[rotated]' })
    expect(mockApi.registerPushToken).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'ExponentPushToken[rotated]' }),
    )

    unwatch()
    expect(remove).toHaveBeenCalled()
  })
})
